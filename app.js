const BENCHMARKS = {
    consulting: { name: 'Consulting & Coaching', targetMargin: 25, ownerPct: 35, laborPct: 45, marketingPct: 15 },
    professional: { name: 'Professional Services', targetMargin: 20, ownerPct: 30, laborPct: 50, marketingPct: 10 },
    healthcare: { name: 'Healthcare & Wellness', targetMargin: 15, ownerPct: 25, laborPct: 55, marketingPct: 5 },
    retail: { name: 'Retail & E-Commerce', targetMargin: 8, ownerPct: 15, laborPct: 15, marketingPct: 12 },
    restaurant: { name: 'Restaurant & Food', targetMargin: 5, ownerPct: 10, laborPct: 35, marketingPct: 5 },
    construction: { name: 'Construction & Trades', targetMargin: 10, ownerPct: 20, laborPct: 25, marketingPct: 5 },
    creative: { name: 'Creative & Agency', targetMargin: 20, ownerPct: 30, laborPct: 50, marketingPct: 10 },
    realestate: { name: 'Real Estate & Property', targetMargin: 20, ownerPct: 30, laborPct: 25, marketingPct: 15 }
};


let parsedData = null;
let selectedIndustry = null;
let multiFileResults = [];
let multiFileIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initFileUpload();
    initManualForm();
    initVerification();
    initModal();
    initReset();
    initExport();
});

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });
}

let stagedFiles = [];

function initFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const analyseBtn = document.getElementById('analyse-btn');

    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, e => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, e => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', e => {
        const files = Array.from(e.dataTransfer.files).filter(f => isValidFile(f));
        if (files.length > 0) addToQueue(files);
    });

    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        fileInput.click();
    });

    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', e => {
        const files = Array.from(e.target.files).filter(f => isValidFile(f));
        if (files.length > 0) addToQueue(files);
        fileInput.value = '';
    });

    analyseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (stagedFiles.length === 0) return;
        handleFiles([...stagedFiles]);
    });
}

function isValidFile(file) {
    const name = file.name.toLowerCase();
    return name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.pdf');
}

function addToQueue(newFiles) {
    const existing = new Set(stagedFiles.map(f => f.name + f.size));
    newFiles.forEach(f => {
        if (!existing.has(f.name + f.size)) stagedFiles.push(f);
    });
    renderQueue();
}

function removeFromQueue(index) {
    stagedFiles.splice(index, 1);
    renderQueue();
}

function renderQueue() {
    const queueEl = document.getElementById('file-queue');
    const emptyState = document.getElementById('upload-empty-state');
    const analyseBtn = document.getElementById('analyse-btn');
    const browseBtn = document.getElementById('browse-btn');

    if (stagedFiles.length === 0) {
        queueEl.classList.add('hidden');
        emptyState.classList.remove('hidden');
        analyseBtn.classList.add('hidden');
        browseBtn.textContent = 'Browse Files';
        return;
    }

    emptyState.classList.add('hidden');
    queueEl.classList.remove('hidden');
    analyseBtn.classList.remove('hidden');
    browseBtn.textContent = 'Add More Files';
    analyseBtn.textContent = `Analyse ${stagedFiles.length} File${stagedFiles.length > 1 ? 's' : ''}`;

    queueEl.innerHTML = stagedFiles.map((file, i) => {
        const ext = file.name.split('.').pop().toUpperCase();
        const size = file.size < 1024 * 1024
            ? Math.round(file.size / 1024) + ' KB'
            : (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        return `
            <div class="queue-item">
                <span class="queue-ext">${ext}</span>
                <span class="queue-name">${file.name}</span>
                <span class="queue-size">${size}</span>
                <button class="queue-remove" data-index="${i}" title="Remove" type="button">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
            </div>
        `;
    }).join('');

    queueEl.querySelectorAll('.queue-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromQueue(parseInt(btn.dataset.index));
        });
    });
}

function resetFileQueue() {
    stagedFiles = [];
    renderQueue();
}

async function handleFiles(files) {
    resetFileQueue();

    if (files.length === 1) {
        showLoading('Reading file...');
        const content = await readFileContent(files[0]);
        processWithAI(content.text, content.type, files[0].name, content.cacheKey);
        return;
    }

    const total = files.length;
    showLoading(`Analysing file 1 of ${total}...`);
    multiFileResults = [];
    multiFileIndex = 0;

    const tasks = files.map(async (file, i) => {
        const content = await readFileContent(file);
        return { name: file.name, text: content.text, type: content.type, cacheKey: content.cacheKey };
    });

    const rawFiles = await Promise.all(tasks);

    const analysed = [];
    for (let i = 0; i < rawFiles.length; i++) {
        showLoading(`Analysing file ${i + 1} of ${total}: ${rawFiles[i].name}`);
        try {
            const result = await analyseStatementWithAI(rawFiles[i].text, rawFiles[i].type, rawFiles[i].cacheKey);
            analysed.push({ name: rawFiles[i].name, result, error: null });
        } catch (err) {
            analysed.push({ name: rawFiles[i].name, result: null, error: err.message, errObj: err });
        }
    }

    hideLoading();

    const successful = analysed.filter(a => a.result !== null);
    if (successful.length === 0) {
        const lastErr = analysed.find(a => a.error)?.errObj || new Error('All files failed');
        showAnalysisError(lastErr, () => handleFiles(files));
        return;
    }

    multiFileResults = successful.map(a => ({
        name: a.name,
        parsedData: buildParsedData(a.result),
        selectedIndustry: a.result.detectedIndustry || null,
        metrics: null,
        benchmark: null
    }));

    const failed = analysed.filter(a => a.result === null);
    if (failed.length > 0) {
        console.warn(`${failed.length} file(s) failed and were skipped: ${failed.map(f => f.name).join(', ')}`);
    }

    multiFileIndex = 0;
    showMultiVerification();
}

async function readFileContent(file) {
    // Cache key: name + size + lastModified uniquely identifies a file version
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Sort items by Y (row) then X (column) so table columns stay aligned
            const sorted = [...textContent.items].sort((a, b) => {
                const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
                return yDiff !== 0 ? yDiff : a.transform[4] - b.transform[4];
            });
            // Group items into lines by Y-coordinate proximity (within 3px = same row)
            const lines = [];
            let currentLine = [];
            let lastY = null;
            for (const item of sorted) {
                const y = Math.round(item.transform[5]);
                if (lastY !== null && Math.abs(y - lastY) > 3) {
                    lines.push(currentLine.map(it => it.str).join(' '));
                    currentLine = [];
                }
                currentLine.push(item);
                lastY = y;
            }
            if (currentLine.length > 0) lines.push(currentLine.map(it => it.str).join(' '));
            fullText += lines.join('\n') + '\n';
        }
        return { text: fullText, type: 'pdf', cacheKey };
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        return { text: XLSX.utils.sheet_to_csv(sheet), type: 'csv', cacheKey };
    } else {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve({ text: e.target.result, type: 'csv', cacheKey });
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}

function buildParsedData(result) {
    const categories = {
        payroll: Number(result.categories?.payroll) || 0,
        rent: Number(result.categories?.rent) || 0,
        marketing: Number(result.categories?.marketing) || 0,
        officeSupplies: Number(result.categories?.officeSupplies) || 0,
        professional: Number(result.categories?.professional) || 0,
        travel: Number(result.categories?.travel) || 0,
        insurance: Number(result.categories?.insurance) || 0,
        taxes: Number(result.categories?.taxes) || 0,
        repairs: Number(result.categories?.repairs) || 0,
        bankFees: Number(result.categories?.bankFees) || 0,
        misc: Number(result.categories?.misc) || 0
    };

    // If the AI's totalOut exceeds the category sum, absorb the gap into misc
    // so Total Expenses always matches totalOut and never silently drops money
    const totalOut = Number(result.totalOut) || 0;
    const catSum = Object.values(categories).reduce((a, b) => a + b, 0);
    if (totalOut > catSum + 1) {
        categories.misc += totalOut - catSum;
    }

    return {
        totalIn: Number(result.totalIn) || 0,
        totalOut,
        txCount: Number(result.txCount) || 0,
        months: Math.max(1, Number(result.months) || 1),
        categories,
        transfersIn: Number(result.transfersIn) || 0,
        transfersOut: Number(result.transfersOut) || 0,
        zellePaypal: Number(result.zellePaypal) || 0,
        startDate: result.startDate ? new Date(result.startDate) : null,
        endDate: result.endDate ? new Date(result.endDate) : null,
        detectedIndustry: result.detectedIndustry || null,
        aiInsights: Array.isArray(result.insights) ? result.insights : [],
        aiActions: Array.isArray(result.actions) ? result.actions : [],
        isCSV: true
    };
}

async function processWithAI(content, fileType, fileName, cacheKey) {
    showLoading('Analysing your statement...');
    try {
        const result = await analyseStatementWithAI(content, fileType, cacheKey);
        parsedData = buildParsedData(result);
        hideLoading();
        if (parsedData.totalIn === 0 && parsedData.totalOut > 0) {
            showIncomeModal();
        } else {
            showVerification();
        }
    } catch (error) {
        hideLoading();
        showAnalysisError(error, () => processWithAI(content, fileType, fileName, cacheKey));
    }
}

function showLoading(msg) {
    const el = document.getElementById('loading-message');
    if (el) el.textContent = msg || 'Processing...';
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}


// ── Analysis Error Flow ──────────────────────────────────────────────

const _errorCfg = {
    credits: {
        title: 'AI Analysis Paused',
        message: 'The analysis service is temporarily out of credits. You can enter your numbers manually right now — the AI analyser will be restored once the account is topped up.',
        retryDelay: null,
        footer: 'Your uploaded file is intact and ready to re-analyse once the service is back.'
    },
    ratelimit: {
        title: 'Service Is Busy',
        message: 'Too many requests at once. The analyser will retry automatically in 60 seconds. You can also switch to manual entry in the meantime.',
        retryDelay: 60,
        footer: 'Your file is queued — no need to re-upload.'
    },
    server: {
        title: 'Service Temporarily Unavailable',
        message: 'The analysis service is experiencing a disruption. It will retry automatically in 5 minutes, or you can use manual entry now for immediate results.',
        retryDelay: 300,
        footer: 'Your file is intact and will be analysed automatically when the service recovers.'
    },
    network: {
        title: 'Connection Failed',
        message: 'Unable to reach the analysis service. Check your internet connection — a retry will run automatically in 30 seconds.',
        retryDelay: 30,
        footer: 'Your file is ready to go once connectivity is restored.'
    },
    unknown: {
        title: 'Analysis Failed',
        message: 'Something went wrong during analysis. You can retry now or switch to manual entry for immediate results.',
        retryDelay: null,
        footer: 'If the problem persists, manual entry will give you the full report.'
    }
};

let _countdownInterval = null;

function showAnalysisError(error, retryFn) {
    // Clear any running countdown
    if (_countdownInterval) { clearInterval(_countdownInterval); _countdownInterval = null; }

    const type = error?.errType || 'unknown';
    const cfg  = _errorCfg[type] || _errorCfg.unknown;

    document.getElementById('error-title').textContent   = cfg.title;
    document.getElementById('error-message').textContent = cfg.message;
    document.getElementById('error-footer').textContent  = cfg.footer;

    const countdownEl  = document.getElementById('error-countdown');
    const timeEl       = document.getElementById('countdown-time');
    const fillEl       = document.getElementById('countdown-fill');
    const retryBtn     = document.getElementById('error-retry-btn');

    if (cfg.retryDelay) {
        countdownEl.classList.remove('hidden');
        retryBtn.disabled = false;

        let remaining = cfg.retryDelay;
        const total   = cfg.retryDelay;

        const tick = () => {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timeEl.textContent  = mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : `${secs}s`;
            fillEl.style.width  = `${((total - remaining) / total) * 100}%`;
            if (remaining <= 0) {
                clearInterval(_countdownInterval);
                _countdownInterval = null;
                hideAnalysisError();
                retryFn();
            }
            remaining--;
        };
        tick();
        _countdownInterval = setInterval(tick, 1000);
    } else {
        countdownEl.classList.add('hidden');
        retryBtn.disabled = false;
    }

    // Wire buttons (replace to avoid duplicate listeners)
    const manualBtn   = document.getElementById('error-manual-btn');
    const newRetryBtn = retryBtn.cloneNode(true);
    const newManualBtn = manualBtn.cloneNode(true);
    retryBtn.parentNode.replaceChild(newRetryBtn, retryBtn);
    manualBtn.parentNode.replaceChild(newManualBtn, manualBtn);

    newRetryBtn.disabled = retryBtn.disabled;
    newRetryBtn.addEventListener('click', () => {
        if (_countdownInterval) { clearInterval(_countdownInterval); _countdownInterval = null; }
        hideAnalysisError();
        retryFn();
    });
    newManualBtn.addEventListener('click', () => {
        if (_countdownInterval) { clearInterval(_countdownInterval); _countdownInterval = null; }
        hideAnalysisError();
        document.getElementById('input-section').classList.remove('hidden');
        document.querySelector('[data-tab="manual"]').click();
    });

    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('error-section').classList.remove('hidden');
}

function hideAnalysisError() {
    document.getElementById('error-section').classList.add('hidden');
    document.getElementById('input-section').classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────

function parseDate(dateStr) {
    if (!dateStr) return null;
    const cleaned = dateStr.trim().replace(/["']/g, '');
    
    const formats = [
        /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
        /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
        /^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/
    ];
    
    for (const fmt of formats) {
        const match = cleaned.match(fmt);
        if (match) {
            let year, month, day;
            if (fmt === formats[0]) {
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                day = parseInt(match[3]);
            } else {
                month = parseInt(match[1]) - 1;
                day = parseInt(match[2]);
                year = parseInt(match[3]);
                if (year < 100) year += 2000;
            }
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }
    }
    
    const fallback = new Date(cleaned);
    return isNaN(fallback.getTime()) ? null : fallback;
}

function parseAmount(value) {
    if (!value) return NaN;
    const cleaned = String(value).replace(/[$,\s]/g, '');
    return parseFloat(cleaned);
}


function showIncomeModal() {
    document.getElementById('income-modal').classList.remove('hidden');
}

function initModal() {
    const modal = document.getElementById('income-modal');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    const incomeInput = document.getElementById('manual-income');

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.querySelector('[data-tab="manual"]').click();
    });

    confirmBtn.addEventListener('click', () => {
        const income = parseFloat(incomeInput.value);
        if (isNaN(income) || income <= 0) {
            alert('Please enter a valid income amount.');
            return;
        }
        parsedData.totalIn = income;
        modal.classList.add('hidden');
        showVerification();
    });

    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

function showMultiVerification() {
    const entry = multiFileResults[multiFileIndex];
    parsedData = entry.parsedData;

    const total = multiFileResults.length;
    const stepEl = document.getElementById('multi-step-indicator');
    if (stepEl) stepEl.textContent = `File ${multiFileIndex + 1} of ${total}: ${entry.name}`;

    const nextBtn = document.getElementById('confirm-analysis');
    if (nextBtn) nextBtn.textContent = multiFileIndex < total - 1 ? 'Next File' : 'Generate Reports';

    showVerification();
}

function showVerification() {
    const multiplier = 12 / parsedData.months;
    
    document.getElementById('verify-income').textContent = fmt(parsedData.totalIn);
    document.getElementById('verify-expenses').textContent = fmt(parsedData.totalOut);
    
    let periodText = `${parsedData.months} month${parsedData.months > 1 ? 's' : ''}`;
    if (parsedData.startDate && parsedData.endDate) {
        const startStr = formatDateShort(parsedData.startDate);
        const endStr = formatDateShort(parsedData.endDate);
        periodText = `${startStr} - ${endStr}`;
    }
    document.getElementById('verify-period').textContent = periodText;
    document.getElementById('verify-multiplier').textContent = `x${multiplier.toFixed(1)}`;
    
    let noteText = `Report below is annualised (x${multiplier.toFixed(1)}). If income looks wrong, try manual entry instead.`;
    if (parsedData.transfersIn > 0 || parsedData.transfersOut > 0) {
        noteText += ` Transfers detected: In ${fmt(parsedData.transfersIn)}, Out ${fmt(parsedData.transfersOut)}.`;
    }
    if (parsedData.zellePaypal > 0) {
        noteText += ` Zelle/PayPal activity: ${fmt(parsedData.zellePaypal)}.`;
    }
    document.getElementById('verify-note').textContent = noteText;

    if (parsedData.detectedIndustry) {
        document.getElementById('csv-industry').value = parsedData.detectedIndustry;
    }

    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('verification-section').classList.remove('hidden');
}

function initVerification() {
    document.getElementById('confirm-analysis').addEventListener('click', () => {
        const industry = document.getElementById('csv-industry').value;
        if (!industry) {
            alert('Please select your industry to continue.');
            return;
        }

        if (multiFileResults.length > 0) {
            multiFileResults[multiFileIndex].selectedIndustry = industry;
            multiFileResults[multiFileIndex].parsedData = parsedData;
            multiFileIndex++;
            if (multiFileIndex < multiFileResults.length) {
                showMultiVerification();
            } else {
                generateMultiReport();
            }
        } else {
            selectedIndustry = industry;
            generateReport();
        }
    });

    document.getElementById('cancel-analysis').addEventListener('click', () => {
        multiFileResults = [];
        multiFileIndex = 0;
        document.getElementById('verification-section').classList.add('hidden');
        document.getElementById('input-section').classList.remove('hidden');
        document.querySelector('[data-tab="manual"]').click();
    });
}

function initManualForm() {
    document.getElementById('manual-form').addEventListener('submit', e => {
        e.preventDefault();
        const form = e.target;
        const period = parseInt(form.period.value);
        const multiplier = 12 / period;

        parsedData = {
            totalIn: (parseFloat(form.revenue.value) || 0) * multiplier,
            totalOut: 0,
            txCount: 0,
            months: period,
            categories: {
                payroll: (parseFloat(form.payroll.value) || 0) * multiplier,
                rent: (parseFloat(form.rent.value) || 0) * multiplier,
                software: (parseFloat(form.software.value) || 0) * multiplier,
                marketing: (parseFloat(form.marketing.value) || 0) * multiplier,
                food: 0,
                misc: (parseFloat(form.misc.value) || 0) * multiplier
            },
            cogs: (parseFloat(form.cogs.value) || 0) * multiplier,
            ownerPay: (parseFloat(form.ownerPay.value) || 0) * multiplier,
            isCSV: false
        };

        selectedIndustry = form.industry.value;
        generateReport();
    });
}

function generateMultiReport() {
    multiFileResults.forEach(entry => {
        const data = entry.parsedData;
        const benchmark = BENCHMARKS[entry.selectedIndustry];

        const totalRevenue = data.totalIn;
        const catPayroll = data.categories.payroll;
        const catRent = data.categories.rent;
        const catMarketing = data.categories.marketing;
        const catOfficeSupplies = data.categories.officeSupplies;
        const catProfessional = data.categories.professional;
        const catTravel = data.categories.travel;
        const catInsurance = data.categories.insurance;
        const catTaxes = data.categories.taxes;
        const catRepairs = data.categories.repairs;
        const catBankFees = data.categories.bankFees;
        const catMisc = data.categories.misc;
        const totalExpenses = catPayroll + catRent + catMarketing + catOfficeSupplies + catProfessional + catTravel + catInsurance + catTaxes + catRepairs + catBankFees + catMisc;
        const netProfit = totalRevenue - totalExpenses;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const laborPct = totalRevenue > 0 ? (catPayroll / totalRevenue) * 100 : 0;
        const marketingPct = totalRevenue > 0 ? (catMarketing / totalRevenue) * 100 : 0;

        entry.metrics = {
            annualRevenue: totalRevenue, totalExpenses, netProfit, netMargin, laborPct, marketingPct,
            ownerPayPct: 0, annualOwnerPay: 0,
            transfersIn: data.transfersIn || 0,
            transfersOut: data.transfersOut || 0,
            zellePaypal: data.zellePaypal || 0,
            categories: {
                payroll: catPayroll, rent: catRent, marketing: catMarketing,
                officeSupplies: catOfficeSupplies, professional: catProfessional,
                travel: catTravel, insurance: catInsurance, taxes: catTaxes,
                repairs: catRepairs, bankFees: catBankFees, misc: catMisc, cogs: 0
            }
        };
        entry.benchmark = benchmark;
    });

    renderMultiReport();
}

function renderMultiReport() {
    document.getElementById('verification-section').classList.add('hidden');
    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('report-section').classList.remove('hidden');

    const tabsContainer = document.getElementById('file-report-tabs');
    const tabsRow = document.getElementById('file-tabs-row');

    if (multiFileResults.length > 1) {
        tabsContainer.classList.remove('hidden');
        tabsRow.innerHTML = multiFileResults.map((entry, i) => {
            const label = entry.name.replace(/\.[^.]+$/, '');
            return `<button class="file-tab-btn${i === 0 ? ' active' : ''}" data-index="${i}">${label}</button>`;
        }).join('');

        tabsRow.querySelectorAll('.file-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                tabsRow.querySelectorAll('.file-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const idx = parseInt(btn.dataset.index);
                const entry = multiFileResults[idx];
                parsedData = entry.parsedData;
                currentMetrics = entry.metrics;
                currentBenchmark = entry.benchmark;
                populateReport(entry.metrics, entry.benchmark, entry.parsedData);
            });
        });
    } else {
        tabsContainer.classList.add('hidden');
    }

    const first = multiFileResults[0];
    parsedData = first.parsedData;
    currentMetrics = first.metrics;
    currentBenchmark = first.benchmark;
    populateReport(first.metrics, first.benchmark, first.parsedData);
}

function generateReport() {
    const multiplier = 12 / parsedData.months;
    const benchmark = BENCHMARKS[selectedIndustry];

    let annualRevenue, annualPayroll, annualRent, annualMarketing, annualOfficeSupplies, annualProfessional, annualTravel, annualInsurance, annualTaxes, annualRepairs, annualBankFees, annualMisc, annualCOGS, annualOwnerPay;

    if (parsedData.isCSV) {
        annualRevenue = parsedData.totalIn;
        annualPayroll = parsedData.categories.payroll;
        annualRent = parsedData.categories.rent;
        annualMarketing = parsedData.categories.marketing;
        annualOfficeSupplies = parsedData.categories.officeSupplies;
        annualProfessional = parsedData.categories.professional;
        annualTravel = parsedData.categories.travel;
        annualInsurance = parsedData.categories.insurance;
        annualTaxes = parsedData.categories.taxes;
        annualRepairs = parsedData.categories.repairs;
        annualBankFees = parsedData.categories.bankFees;
        annualMisc = parsedData.categories.misc;
        annualCOGS = 0;
        annualOwnerPay = 0;
    } else {
        annualRevenue = parsedData.totalIn;
        annualPayroll = parsedData.categories.payroll;
        annualRent = parsedData.categories.rent;
        annualMarketing = parsedData.categories.marketing;
        annualOfficeSupplies = parsedData.categories.officeSupplies || 0;
        annualProfessional = parsedData.categories.professional || 0;
        annualTravel = parsedData.categories.travel || 0;
        annualInsurance = parsedData.categories.insurance || 0;
        annualTaxes = parsedData.categories.taxes || 0;
        annualRepairs = parsedData.categories.repairs || 0;
        annualBankFees = parsedData.categories.bankFees || 0;
        annualMisc = parsedData.categories.misc;
        annualCOGS = parsedData.cogs || 0;
        annualOwnerPay = parsedData.ownerPay || 0;
    }

    const totalExpenses = annualPayroll + annualRent + annualMarketing + annualOfficeSupplies + annualProfessional + annualTravel + annualInsurance + annualTaxes + annualRepairs + annualBankFees + annualMisc + annualCOGS;
    const netProfit = annualRevenue - totalExpenses;
    const netMargin = annualRevenue > 0 ? (netProfit / annualRevenue) * 100 : 0;
    const expenseRatio = annualRevenue > 0 ? (totalExpenses / annualRevenue) * 100 : 0;
    const laborPct = annualRevenue > 0 ? (annualPayroll / annualRevenue) * 100 : 0;
    const marketingPct = annualRevenue > 0 ? (annualMarketing / annualRevenue) * 100 : 0;
    const ownerPayPct = annualRevenue > 0 ? (annualOwnerPay / annualRevenue) * 100 : 0;

    let transfersIn = 0;
    let transfersOut = 0;
    let zellePaypal = 0;
    if (parsedData.isCSV) {
        transfersIn = parsedData.transfersIn || 0;
        transfersOut = parsedData.transfersOut || 0;
        zellePaypal = parsedData.zellePaypal || 0;
    }

    const metrics = {
        annualRevenue,
        totalExpenses,
        netProfit,
        netMargin,
        laborPct,
        marketingPct,
        ownerPayPct,
        annualOwnerPay,
        transfersIn,
        transfersOut,
        zellePaypal,
        categories: {
            payroll: annualPayroll,
            rent: annualRent,
            marketing: annualMarketing,
            officeSupplies: annualOfficeSupplies,
            professional: annualProfessional,
            travel: annualTravel,
            insurance: annualInsurance,
            taxes: annualTaxes,
            repairs: annualRepairs,
            bankFees: annualBankFees,
            misc: annualMisc,
            cogs: annualCOGS
        }
    };

    currentMetrics = metrics;
    currentBenchmark = benchmark;
    multiFileResults = [];
    multiFileIndex = 0;
    document.getElementById('file-report-tabs').classList.add('hidden');
    renderReport(metrics, benchmark);
}

function renderReport(metrics, benchmark) {
    document.getElementById('verification-section').classList.add('hidden');
    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('report-section').classList.remove('hidden');
    populateReport(metrics, benchmark, parsedData);
}

function populateReport(metrics, benchmark, data) {
    let periodHTML;
    if (data.isCSV) {
        if (data.startDate && data.endDate) {
            const startStr = formatDateShort(data.startDate);
            const endStr = formatDateShort(data.endDate);
            periodHTML = `<span class="period-label">Statement Period:</span> <span class="period-dates">${startStr} to ${endStr}</span> <span class="period-info"><span class="period-duration">${data.months} month${data.months > 1 ? 's' : ''}</span> <span class="period-meta">${data.txCount} transactions</span></span>`;
        } else {
            periodHTML = `CSV Analysis - ${data.txCount} transactions - ~${data.months} month${data.months > 1 ? 's' : ''}`;
        }
    } else {
        periodHTML = `Manual Entry - ${data.months} month${data.months > 1 ? 's' : ''} - ${benchmark.name}`;
    }
    document.getElementById('period-badge').innerHTML = periodHTML;

    renderKPIs(metrics, benchmark, data);
    renderSpendBars(metrics);
    renderBenchmarks(metrics, benchmark, data);
    renderInsights(metrics, benchmark, data);
    renderActions(metrics, benchmark, data);
}

function renderKPIs(metrics, benchmark, data) {
    const grid = document.getElementById('kpi-grid');
    
    let marginColor = 'green';
    if (metrics.netMargin < benchmark.targetMargin * 0.5) marginColor = 'red';
    else if (metrics.netMargin < benchmark.targetMargin * 0.8) marginColor = 'amber';

    let fourthCard;
    if (data.isCSV) {
        fourthCard = `
            <div class="kpi-card">
                <div class="kpi-label">Transfers Detected</div>
                <div class="kpi-value">${fmt(metrics.transfersIn + metrics.transfersOut)}</div>
                <div class="kpi-subtext">In: ${fmt(metrics.transfersIn)} / Out: ${fmt(metrics.transfersOut)}</div>
            </div>
        `;
    } else {
        fourthCard = `
            <div class="kpi-card">
                <div class="kpi-label">Owner Pay</div>
                <div class="kpi-value">${fmt(metrics.annualOwnerPay)}</div>
                <div class="kpi-subtext">${fmtPct(metrics.ownerPayPct)} of revenue</div>
            </div>
        `;
    }

    const revenueLabel = data.isCSV ? 'Total Revenue' : 'Annual Revenue';
    const revenueSubtext = data.isCSV ? `Over ${data.months} month${data.months > 1 ? 's' : ''}` : 'Projected yearly';

    grid.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-label">${revenueLabel}</div>
            <div class="kpi-value">${fmt(metrics.annualRevenue)}</div>
            <div class="kpi-subtext">${revenueSubtext}</div>
        </div>`;
    grid.innerHTML += `
        <div class="kpi-card">
            <div class="kpi-label">Total Expenses</div>
            <div class="kpi-value">${fmt(metrics.totalExpenses)}</div>
            <div class="kpi-subtext">${fmtPct(metrics.totalExpenses / metrics.annualRevenue * 100)} of revenue</div>
        </div>
        <div class="kpi-card ${marginColor}">
            <div class="kpi-label">Net Profit Margin</div>
            <div class="kpi-value">${fmtPct(metrics.netMargin)}</div>
            <div class="kpi-subtext">Target: ${benchmark.targetMargin}%</div>
        </div>
        ${fourthCard}
    `;
}

function renderSpendBars(metrics) {
    const container = document.getElementById('spend-bars');
    const mainCats = [
        { name: 'Payroll & Benefits', amount: metrics.categories.payroll },
        { name: 'Rent & Utilities', amount: metrics.categories.rent },
        { name: 'Marketing & Advertising', amount: metrics.categories.marketing },
        { name: 'Office Supplies', amount: metrics.categories.officeSupplies },
        { name: 'Professional Services', amount: metrics.categories.professional },
        { name: 'Travel & Meals', amount: metrics.categories.travel },
        { name: 'Insurance', amount: metrics.categories.insurance },
        { name: 'Taxes & Licenses', amount: metrics.categories.taxes },
        { name: 'Repairs & Maintenance', amount: metrics.categories.repairs },
        { name: 'Bank Fees & Interest', amount: metrics.categories.bankFees },
        { name: 'COGS', amount: metrics.categories.cogs }
    ].filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
    
    const cats = [...mainCats];
    if (metrics.categories.misc > 0) {
        cats.push({ name: 'Misc & Other', amount: metrics.categories.misc });
    }

    const transferCats = [];
    if (metrics.transfersIn > 0) {
        transferCats.push({ name: 'Transfers In', amount: metrics.transfersIn, isTransfer: true });
    }
    if (metrics.transfersOut > 0) {
        transferCats.push({ name: 'Transfers Out', amount: metrics.transfersOut, isTransfer: true });
    }
    if (metrics.zellePaypal > 0) {
        transferCats.push({ name: 'Zelle/PayPal/Venmo', amount: metrics.zellePaypal, isTransfer: true });
    }

    const maxPct = cats.length > 0 ? (cats[0].amount / metrics.annualRevenue) * 100 : 0;

    let html = cats.map(cat => {
        const pct = metrics.annualRevenue > 0 ? (cat.amount / metrics.annualRevenue) * 100 : 0;
        const barWidth = maxPct > 0 ? (pct / maxPct) * 100 : 0;
        return `
            <div class="spend-item">
                <div class="spend-header">
                    <span class="spend-label">${cat.name}</span>
                    <span class="spend-values"><strong>${fmt(cat.amount)}</strong> (${fmtPct(pct)})</span>
                </div>
                <div class="spend-bar-bg">
                    <div class="spend-bar-fill" style="width: ${barWidth}%"></div>
                </div>
            </div>
        `;
    }).join('');

    if (transferCats.length > 0) {
        html += '<div class="transfer-section"><h4 class="transfer-title">Transfers & Payment Platforms</h4>';
        html += transferCats.map(cat => {
            const pct = metrics.annualRevenue > 0 ? (cat.amount / metrics.annualRevenue) * 100 : 0;
            return `
                <div class="spend-item transfer-item">
                    <div class="spend-header">
                        <span class="spend-label">${cat.name}</span>
                        <span class="spend-values"><strong>${fmt(cat.amount)}</strong> (${fmtPct(pct)})</span>
                    </div>
                    <div class="spend-bar-bg transfer-bar">
                        <div class="spend-bar-fill transfer-fill" style="width: ${Math.min(pct * 2, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
        html += '</div>';
    }

    if (cats.length === 0 && transferCats.length === 0) {
        html = '<p style="color: var(--color-text-muted); font-size: 0.875rem;">No expense categories detected.</p>';
    }

    container.innerHTML = html;
}

function renderBenchmarks(metrics, benchmark, data) {
    const table = document.getElementById('benchmark-table');

    const marginStatus = getMarginStatus(metrics.netMargin, benchmark.targetMargin);
    const laborStatus = getLaborStatus(metrics.laborPct, benchmark.laborPct);
    const marketingStatus = metrics.marketingPct > 0 ? { text: 'On track', color: 'green' } : { text: 'Watch this', color: 'amber' };
    const ownerStatus = getOwnerStatus(metrics.ownerPayPct, benchmark.ownerPct);

    let ownerPayRow = '';
    if (!data.isCSV) {
        ownerPayRow = `
            <div class="benchmark-row">
                <span class="benchmark-metric">Owner Pay % of Revenue</span>
                <span class="benchmark-yours">${fmtPct(metrics.ownerPayPct)}</span>
                <span class="benchmark-target">${benchmark.ownerPct}%</span>
                <span class="status-pill ${ownerStatus.color}">${ownerStatus.text}</span>
            </div>
        `;
    }

    table.innerHTML = `
        <div class="benchmark-row">
            <span class="benchmark-metric">Net Profit Margin</span>
            <span class="benchmark-yours">${fmtPct(metrics.netMargin)}</span>
            <span class="benchmark-target">${benchmark.targetMargin}%</span>
            <span class="status-pill ${marginStatus.color}">${marginStatus.text}</span>
        </div>
        <div class="benchmark-row">
            <span class="benchmark-metric">Labor % of Revenue</span>
            <span class="benchmark-yours">${fmtPct(metrics.laborPct)}</span>
            <span class="benchmark-target">${benchmark.laborPct}%</span>
            <span class="status-pill ${laborStatus.color}">${laborStatus.text}</span>
        </div>
        <div class="benchmark-row">
            <span class="benchmark-metric">Marketing % of Revenue</span>
            <span class="benchmark-yours">${fmtPct(metrics.marketingPct)}</span>
            <span class="benchmark-target">${benchmark.marketingPct}%</span>
            <span class="status-pill ${marketingStatus.color}">${marketingStatus.text}</span>
        </div>
        ${ownerPayRow}
    `;
}

function getMarginStatus(margin, target) {
    if (margin >= target) return { text: 'On track', color: 'green' };
    if (margin >= target * 0.5) return { text: 'Watch this', color: 'amber' };
    return { text: 'Needs attention', color: 'red' };
}

function getLaborStatus(labor, benchmark) {
    const score = benchmark + 5 - labor;
    if (score >= 10) return { text: 'On track', color: 'green' };
    if (score >= 0) return { text: 'Watch this', color: 'amber' };
    return { text: 'Needs attention', color: 'red' };
}

function getOwnerStatus(ownerPct, benchmark) {
    if (ownerPct >= benchmark) return { text: 'On track', color: 'green' };
    if (ownerPct >= benchmark * 0.5) return { text: 'Watch this', color: 'amber' };
    return { text: 'Needs attention', color: 'red' };
}

function renderInsights(metrics, benchmark, data) {
    const container = document.getElementById('insights-list');

    if (data && data.isCSV && data.aiInsights && data.aiInsights.length > 0) {
        const icons = {
            good: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            warn: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
            action: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
        };
        container.innerHTML = data.aiInsights.map(insight => `
            <div class="insight-item ${insight.type || 'warn'}">
                <div class="insight-icon">${icons[insight.type] || icons.warn}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title || ''}</div>
                    <div class="insight-text">${insight.text || ''}</div>
                </div>
            </div>
        `).join('');
        return;
    }

    const insights = [];

    const gapAmount = metrics.annualRevenue * (benchmark.targetMargin - metrics.netMargin) / 100;

    if (metrics.netMargin < benchmark.targetMargin * 0.5) {
        insights.push({
            type: 'action',
            title: `Margin is ${fmtPct(metrics.netMargin)} - well below ${benchmark.targetMargin}% target`,
            text: `To reach target, increase revenue by ${fmt(gapAmount)} or reduce expenses by the same.`
        });
    } else if (metrics.netMargin < benchmark.targetMargin) {
        insights.push({
            type: 'warn',
            title: `Margin below target - ${fmtPct(metrics.netMargin)} vs ${benchmark.targetMargin}% goal`,
            text: `You're close. Review your top 2 expense categories for quick efficiency gains.`
        });
    } else {
        insights.push({
            type: 'good',
            title: `Strong margin - ${fmtPct(metrics.netMargin)} exceeds your ${benchmark.targetMargin}% benchmark`,
            text: `You're above industry average. Focus on protecting this margin as you scale.`
        });
    }

    if (!parsedData.isCSV && metrics.annualOwnerPay < 50000 && metrics.annualRevenue > 100000) {
        insights.push({
            type: 'action',
            title: 'You are significantly underpaying yourself',
            text: 'Your revenue supports a higher owner salary. Underpaying creates a false picture of true profitability.'
        });
    }

    if (metrics.laborPct > benchmark.laborPct * 1.3) {
        insights.push({
            type: 'warn',
            title: `Labor costs are high at ${fmtPct(metrics.laborPct)} of revenue`,
            text: `Benchmark is ~${benchmark.laborPct}%. Review team productivity and whether all roles are revenue-generating.`
        });
    }

    const icons = {
        good: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        warn: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        action: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };

    container.innerHTML = insights.map(insight => `
        <div class="insight-item ${insight.type}">
            <div class="insight-icon">${icons[insight.type]}</div>
            <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-text">${insight.text}</div>
            </div>
        </div>
    `).join('');
}

function renderActions(metrics, benchmark, data) {
    const container = document.getElementById('actions-list');

    if (data && data.isCSV && data.aiActions && data.aiActions.length > 0) {
        container.innerHTML = data.aiActions.map((action, i) => `
            <div class="action-item">
                <div class="action-number">${i + 1}</div>
                <div class="action-content">
                    <div class="action-title">${action.title || ''}</div>
                    <div class="action-desc">${action.desc || ''}</div>
                </div>
            </div>
        `).join('');
        return;
    }

    const actions = [];

    actions.push({
        title: 'Bring these numbers to Session 5',
        desc: 'Screenshot this page or note your key metrics. Kelli will help you interpret them live.'
    });

    if (metrics.netMargin < benchmark.targetMargin) {
        const cats = [
            { name: 'Payroll', amount: metrics.categories.payroll },
            { name: 'Rent & Office', amount: metrics.categories.rent },
            { name: 'Software', amount: metrics.categories.software },
            { name: 'Marketing', amount: metrics.categories.marketing },
            { name: 'COGS', amount: metrics.categories.cogs },
            { name: 'Misc & Other', amount: metrics.categories.misc }
        ].filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

        if (cats.length > 0) {
            const largest = cats[0];
            const savings = largest.amount * 0.1;
            actions.push({
                title: 'Identify your biggest expense to cut',
                desc: `Your largest expense is ${largest.name}. A 10% reduction could add ${fmt(savings)} back.`
            });
        } else {
            actions.push({
                title: 'Review your expense categories',
                desc: 'Identify areas where you can reduce spending to improve your margin.'
            });
        }
    } else {
        actions.push({
            title: 'Plan your next pricing increase',
            desc: 'Your margins are healthy. Raise prices before you hire.'
        });
    }

    container.innerHTML = actions.map((action, i) => `
        <div class="action-item">
            <div class="action-number">${i + 1}</div>
            <div class="action-content">
                <div class="action-title">${action.title}</div>
                <div class="action-desc">${action.desc}</div>
            </div>
        </div>
    `).join('');
}

function initReset() {
    document.getElementById('reset-btn').addEventListener('click', () => {
        parsedData = null;
        selectedIndustry = null;
        multiFileResults = [];
        multiFileIndex = 0;
        document.getElementById('report-section').classList.add('hidden');
        document.getElementById('verification-section').classList.add('hidden');
        document.getElementById('input-section').classList.remove('hidden');
        document.getElementById('file-report-tabs').classList.add('hidden');
        document.getElementById('confirm-analysis').textContent = 'Generate Report';
        document.getElementById('manual-form').reset();
        document.getElementById('csv-industry').value = '';
        resetFileQueue();
        document.querySelector('[data-tab="upload"]').click();
    });
}

function fmt(n) {
    if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + Math.round(n);
}

function fmtPct(n) {
    return (Math.round(n * 10) / 10) + '%';
}

function formatDateShort(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

let currentMetrics = null;
let currentBenchmark = null;

function initExport() {
    document.getElementById('export-btn').addEventListener('click', async () => {
        const reportSection = document.getElementById('report-section');
        const headerActions = document.querySelector('.report-header-actions');
        
        headerActions.style.visibility = 'hidden';

        const originalWidth = reportSection.style.width;
        const originalMinWidth = reportSection.style.minWidth;
        const isMobile = window.innerWidth < 900;
        
        if (isMobile) {
            reportSection.style.width = '1200px';
            reportSection.style.minWidth = '1200px';
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(reportSection, {
                backgroundColor: '#FAFAFA',
                scale: 3,
                logging: false,
                useCORS: true,
                windowWidth: 1200
            });

            const link = document.createElement('a');
            link.download = `financial-snapshot-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch (error) {
            alert('Export failed. Please try again.');
        }

        headerActions.style.visibility = 'visible';
        if (isMobile) {
            reportSection.style.width = originalWidth;
            reportSection.style.minWidth = originalMinWidth;
        }
    });

    document.getElementById('export-excel-btn').addEventListener('click', () => {
        if (!currentMetrics || !currentBenchmark) {
            alert('No report data available to export.');
            return;
        }

        const metrics = currentMetrics;
        const benchmark = currentBenchmark;

        let periodText = '';
        if (parsedData.isCSV && parsedData.startDate && parsedData.endDate) {
            periodText = `${formatDateShort(parsedData.startDate)} to ${formatDateShort(parsedData.endDate)}`;
        } else if (parsedData.isCSV) {
            periodText = `${parsedData.months} month(s)`;
        } else {
            periodText = `${parsedData.months} month(s) - ${benchmark.name}`;
        }

        const summaryData = [
            ['Financial Snapshot Report'],
            ['Generated', new Date().toLocaleDateString()],
            ['Period', periodText],
            [''],
            ['KEY METRICS'],
            ['Annual Revenue', fmtExcel(metrics.annualRevenue)],
            ['Total Expenses', fmtExcel(metrics.totalExpenses)],
            ['Net Profit', fmtExcel(metrics.netProfit)],
            ['Net Profit Margin', fmtPctExcel(metrics.netMargin)],
            [''],
            ['EXPENSE BREAKDOWN'],
            ['Category', 'Amount', '% of Revenue'],
            ['Payroll & Benefits', fmtExcel(metrics.categories.payroll), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.payroll / metrics.annualRevenue) * 100 : 0)],
            ['Rent & Utilities', fmtExcel(metrics.categories.rent), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.rent / metrics.annualRevenue) * 100 : 0)],
            ['Marketing & Advertising', fmtExcel(metrics.categories.marketing), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.marketing / metrics.annualRevenue) * 100 : 0)],
            ['Office Supplies', fmtExcel(metrics.categories.officeSupplies), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.officeSupplies / metrics.annualRevenue) * 100 : 0)],
            ['Professional Services', fmtExcel(metrics.categories.professional), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.professional / metrics.annualRevenue) * 100 : 0)],
            ['Travel & Meals', fmtExcel(metrics.categories.travel), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.travel / metrics.annualRevenue) * 100 : 0)],
            ['Insurance', fmtExcel(metrics.categories.insurance), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.insurance / metrics.annualRevenue) * 100 : 0)],
            ['Taxes & Licenses', fmtExcel(metrics.categories.taxes), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.taxes / metrics.annualRevenue) * 100 : 0)],
            ['Repairs & Maintenance', fmtExcel(metrics.categories.repairs), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.repairs / metrics.annualRevenue) * 100 : 0)],
            ['Bank Fees & Interest', fmtExcel(metrics.categories.bankFees), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.bankFees / metrics.annualRevenue) * 100 : 0)],
            ['COGS', fmtExcel(metrics.categories.cogs), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.cogs / metrics.annualRevenue) * 100 : 0)],
            ['Misc & Other', fmtExcel(metrics.categories.misc), fmtPctExcel(metrics.annualRevenue > 0 ? (metrics.categories.misc / metrics.annualRevenue) * 100 : 0)],
            [''],
            ['INDUSTRY BENCHMARKS'],
            ['Metric', 'Your Value', 'Target'],
            ['Net Profit Margin', fmtPctExcel(metrics.netMargin), benchmark.targetMargin + '%'],
            ['Labor % of Revenue', fmtPctExcel(metrics.laborPct), benchmark.laborPct + '%'],
            ['Marketing % of Revenue', fmtPctExcel(metrics.marketingPct), benchmark.marketingPct + '%']
        ];

        if (parsedData.isCSV && (metrics.transfersIn > 0 || metrics.transfersOut > 0)) {
            summaryData.push(['']);
            summaryData.push(['TRANSFERS DETECTED']);
            summaryData.push(['Transfers In', fmtExcel(metrics.transfersIn)]);
            summaryData.push(['Transfers Out', fmtExcel(metrics.transfersOut)]);
            if (metrics.zellePaypal > 0) {
                summaryData.push(['Zelle/PayPal/Venmo', fmtExcel(metrics.zellePaypal)]);
            }
        }

        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        
        ws['!cols'] = [
            { wch: 25 },
            { wch: 15 },
            { wch: 15 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');

        XLSX.writeFile(wb, `financial-snapshot-${new Date().toISOString().split('T')[0]}.xlsx`);
    });
}

function fmtExcel(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPctExcel(n) {
    return (Math.round(n * 10) / 10) + '%';
}
