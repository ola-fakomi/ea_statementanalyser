
const _cfg = {
    e: '/api/analyse',
    m: 'claude-sonnet-4-5'
};

const _MAX = 60000;

function _downloadLog(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ea-ai-debug-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
}

async function analyseStatementWithAI(rawContent, fileType, cacheKey) {
    // Return cached result immediately if available — eliminates API non-determinism
    if (cacheKey) {
        const cached = localStorage.getItem('ea_result_' + cacheKey);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }
    }

    const content = rawContent.length > _MAX
        ? rawContent.slice(0, _MAX) + '\n[content truncated for length]'
        : rawContent;

    const sysPrompt = `Extract financial data from the bank statement and return ONLY a raw JSON object. No markdown, no code fences, no explanation.

JSON structure (numbers only, no $ symbols):
{"totalIn":0,"totalOut":0,"txCount":0,"months":1,"startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","transfersIn":0,"transfersOut":0,"zellePaypal":0,"detectedIndustry":null,"categories":{"payroll":0,"rent":0,"marketing":0,"officeSupplies":0,"professional":0,"travel":0,"insurance":0,"taxes":0,"repairs":0,"bankFees":0,"misc":0},"insights":[{"type":"good","title":"","text":""}],"actions":[{"title":"","desc":""}]}

CATEGORIZATION RULES — assign every expense transaction to exactly one category key. Each transaction goes to exactly ONE category, never two:

payroll: salaries, wages, payroll runs, direct deposit payroll, PPD payroll, employee compensation (NOT health insurance — that goes to insurance)
rent: rent, lease, office space, electricity, electric, con edison, utility, utilities, internet, comcast, xfinity, water, gas bill
marketing: ads, advertising, google ads, facebook ads, meta, mailchimp, branding, website, marketing
officeSupplies: amazon, staples, office depot, software, subscriptions, netflix, spotify, apple, microsoft, adobe, computer, equipment, stationery, best buy
professional: legal, accounting, consulting, attorney, lawyer, cpa, quickbooks, bookkeeping
travel: uber, lyft, taxi, flight, airline, hotel, lodging, airbnb, mileage, parking, gas station, shell, exxon, chevron, fuel, starbucks, coffee, restaurant, chipotle, mcdonald, panera, food, dining, doordash, grubhub, meals
insurance: insurance, health insurance, dental insurance, vision insurance, liability, workers comp, property insurance, geico, allstate, statefarm
taxes: irs, tax payment, estimated tax, payroll tax, sales tax, operating license
repairs: repair, maintenance, cleaning, plumber, electrician, contractor, home depot, lowes
bankFees: bank fee, overdraft, wire fee, monthly fee, service charge, atm fee, interest charge, credit card autopay, chase credit, late fee
misc: planet fitness, gym, membership, walmart, target, costco, trader joe, whole foods, flowers, gift, personal, zelle, venmo, cashapp, paypal, any transaction that does not fit the above categories

IMPORTANT RULES:
- totalIn: sum of all credits and deposits (payroll deposits, transfers in)
- totalOut: sum of all debits and payments EXCLUDING internal same-owner transfers. This MUST equal the sum of all category values.
- transfersIn: deposits that are internal transfers from same owner's other accounts
- transfersOut: payments that are internal transfers to same owner's other accounts (e.g. credit card autopay to same owner)
- zellePaypal: total of all Zelle, PayPal, Venmo, CashApp transactions
- months: count of distinct calendar months in the statement
- startDate/endDate: first and last transaction dates in YYYY-MM-DD
- detectedIndustry: one of consulting/professional/healthcare/retail/restaurant/construction/creative/realestate or null
- txCount: total number of individual transactions
- insights: exactly 4 items each with type (good/warn/action), title, and text referencing specific dollar amounts from the data
- actions: exactly 3 actionable recommendations backed by specific numbers from the data
- Output ONLY the JSON object, nothing else`;

    const response = await fetch(_cfg.e, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            model: _cfg.m,
            max_tokens: 4096,
            temperature: 0,
            system: sysPrompt,
            messages: [
                { role: 'user', content: `Analyse this ${fileType === 'pdf' ? 'PDF bank statement' : 'bank statement CSV/spreadsheet'}:\n\n${content}` }
            ]
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        const logPayload = JSON.stringify({ timestamp: new Date().toISOString(), status: response.status, body: errText }, null, 2);
        _downloadLog(logPayload);

        // Classify the failure so the UI can show the right message + retry delay
        let errType = 'server';
        if (response.status === 400 && errText.includes('credit')) errType = 'credits';
        else if (response.status === 429) errType = 'ratelimit';
        else if (response.status >= 500)  errType = 'server';

        const err = new Error(`Analysis service returned status ${response.status}.`);
        err.errType = errType;
        throw err;
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text || '').trim();

    const logPayload = JSON.stringify({ timestamp: new Date().toISOString(), fullResponse: data, extractedText: text }, null, 2);
    localStorage.setItem('ea_ai_last_response', logPayload);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        _downloadLog(logPayload);
        throw new Error('Could not extract structured data from AI response. A debug log has been downloaded.');
    }

    try {
        const result = JSON.parse(jsonMatch[0]);
        // Cache result so the same file always produces the same report
        if (cacheKey) {
            try { localStorage.setItem('ea_result_' + cacheKey, JSON.stringify(result)); } catch(e) {}
        }
        return result;
    } catch (e) {
        _downloadLog(logPayload);
        throw new Error('AI response JSON was malformed. A debug log has been downloaded.');
    }
}
