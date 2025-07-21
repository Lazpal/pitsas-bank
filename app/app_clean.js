// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Προστασία από uncaught errors που προέρχονται από extensions
    window.addEventListener('error', function(event) {
        // Αγνοούμε errors που προέρχονται από browser extensions
        if (event.filename && (event.filename.includes('extension://') || event.filename.includes('chrome-extension://'))) {
            return;
        }
        // Αγνοούμε JSON parse errors από extensions
        if (event.message && event.message.includes('is not valid JSON') && event.filename.includes('content.js')) {
            return;
        }
        console.warn('Handled error:', event.message);
    });
    
    // Set up initial data if not exists
    if (!localStorage.getItem('pitsasUsers')) {
        localStorage.setItem('pitsasUsers', JSON.stringify([
            { username: 'admin', password: 'admin123', name: 'Διαχειριστής' },
            { username: 'staff1', password: 'staff123', name: 'Προσωπικό 1' }
        ]));
    }
    
    if (!localStorage.getItem('pitsasChildren')) {
        localStorage.setItem('pitsasChildren', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('pitsasTransactions')) {
        localStorage.setItem('pitsasTransactions', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('pitsasSettings')) {
        localStorage.setItem('pitsasSettings', JSON.stringify({
            itemsPerPage: 10,
            darkMode: false,
            lastBackup: null
        }));
    }
    
    // Μετανάστευση δεδομένων - εξασφάλιση ότι όλα τα παιδιά έχουν τα νέα πεδία
    migrateChildrenData();
    
    // Global state tracking
    let currentView = 'dashboard';
    
    // DOM Elements with null checks
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const staffNameElement = document.getElementById('staff-name');
    const logoutBtn = document.getElementById('logout-btn');
    const currentTimeElement = document.getElementById('current-time');
    
    // Validation: Check if critical elements exist
    if (!loginForm || !loginContainer || !appContainer) {
        console.error('Critical DOM elements missing');
        return;
    }
    
    // Navigation links with null checks
    const dashboardLink = document.getElementById('dashboard-link');
    const childrenLink = document.getElementById('children-link');
    const transactionsLink = document.getElementById('transactions-link');
    const statisticsLink = document.getElementById('statistics-link');
    
    // Views with null checks
    const dashboardView = document.getElementById('dashboard-view');
    const childrenView = document.getElementById('children-view');
    const transactionsView = document.getElementById('transactions-view');
    const statisticsView = document.getElementById('statistics-view');
    
    // Validation: Check if navigation elements exist
    if (!dashboardLink || !childrenLink || !transactionsLink || !statisticsLink) {
        console.error('Navigation elements missing');
        return;
    }
    
    if (!dashboardView || !childrenView || !transactionsView || !statisticsView) {
        console.error('View elements missing');
        return;
    }
    
    // Quick action buttons
    const addChildBtn = document.getElementById('add-child-btn');
    const quickDepositBtn = document.getElementById('quick-deposit-btn');
    const quickWithdrawBtn = document.getElementById('quick-withdraw-btn');
    const viewAllTransactionsBtn = document.getElementById('view-all-transactions');
    const backupBtn = document.getElementById('backup-btn');
    
    // Modals with error handling
    let addChildModal, transactionModal, receiptModal, idCardModal, backupModal, 
        limitOverrideModal, quickSearchModal, bulkDepositModal, dailyReportModal, 
        settingsModal, keyboardShortcutsModal, advancedSearchModal, 
        documentationModal, documentationWindowModal, excelImportModal;
    
    try {
        addChildModal = new bootstrap.Modal(document.getElementById('addChildModal'));
        transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
        receiptModal = new bootstrap.Modal(document.getElementById('receiptModal'));
        idCardModal = new bootstrap.Modal(document.getElementById('idCardModal'));
        backupModal = new bootstrap.Modal(document.getElementById('backupModal'));
        limitOverrideModal = new bootstrap.Modal(document.getElementById('limitOverrideModal'));
        quickSearchModal = new bootstrap.Modal(document.getElementById('quickSearchModal'));
        bulkDepositModal = new bootstrap.Modal(document.getElementById('bulkDepositModal'));
        dailyReportModal = new bootstrap.Modal(document.getElementById('dailyReportModal'));
        settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
        keyboardShortcutsModal = new bootstrap.Modal(document.getElementById('keyboardShortcutsModal'));
        advancedSearchModal = new bootstrap.Modal(document.getElementById('advancedSearchModal'));
        documentationModal = new bootstrap.Modal(document.getElementById('documentationModal'));
        documentationWindowModal = new bootstrap.Modal(document.getElementById('documentationWindowModal'));
        excelImportModal = new bootstrap.Modal(document.getElementById('excelImportModal'));
    } catch (error) {
        console.error('Error initializing modals:', error);
        showNotification('Σφάλμα κατά την αρχικοποίηση των modals', 'error');
    }
    
    // Add event listener to clean up transaction modal classes when hidden
    document.getElementById('transactionModal').addEventListener('hidden.bs.modal', function () {
        const modalContent = this.querySelector('.modal-content');
        modalContent.classList.remove('modal-deposit', 'modal-withdraw');
    });
    
    // Add Enter key functionality to modals
    // For Add Child Modal
    document.getElementById('addChildModal').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Don't trigger if we're in a textarea (for notes)
            if (e.target.tagName.toLowerCase() !== 'textarea') {
                saveChildBtn.click();
            }
        }
    });
    
    // For Transaction Modal
    document.getElementById('transactionModal').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Don't trigger if we're in a textarea (for notes)
            if (e.target.tagName.toLowerCase() !== 'textarea') {
                saveTransactionBtn.click();
            }
        }
    });
    
    // For Limit Override Modal
    document.getElementById('limitOverrideModal').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Don't trigger if we're in a textarea (for reason)
            if (e.target.tagName.toLowerCase() !== 'textarea') {
                // Only trigger if the confirm checkbox is checked
                if (document.getElementById('confirm-override').checked) {
                    confirmOverrideBtn.click();
                }
            }
        }
    });
    
    // For Login Form (already has submit event but let's ensure Enter works)
    document.getElementById('login-container').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Export buttons
    const exportChildrenBtn = document.getElementById('export-children-btn');
    const exportTransactionsBtn = document.getElementById('export-transactions-btn');
    
    // Form submission buttons
    const saveChildBtn = document.getElementById('save-child-btn');
    const saveTransactionBtn = document.getElementById('save-transaction-btn');
    
    // Print buttons
    const printReceiptBtn = document.getElementById('print-receipt-btn');
    const printIdCardBtn = document.getElementById('print-id-card-btn');
    
    // Backup/Restore buttons
    const createBackupBtn = document.getElementById('create-backup-btn');
    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    const backupFileInput = document.getElementById('backup-file');
    
    // Limit override buttons
    const confirmOverrideBtn = document.getElementById('confirm-override-btn');
    const cancelOverrideBtn = document.getElementById('cancel-override-btn');
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Check if dark mode is enabled
    let settings;
    try {
        const settingsData = localStorage.getItem('pitsasSettings');
        settings = settingsData ? JSON.parse(settingsData) : {};
    } catch (e) {
        console.warn('Error parsing settings from localStorage:', e);
        settings = { darkMode: false };
    }
    
    if (settings && settings.darkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    }
    
    // Έλεγχος και επαναφορά ημερήσιων ορίων κατά την εκκίνηση
    resetDailySpending();
    
    // Ρύθμιση ημερήσιου ελέγχου για επαναφορά ορίων στις 00:00
    setupDailyLimitReset();
    
    // Update current time every minute
    function updateCurrentTime() {
        const now = new Date();
        currentTimeElement.textContent = now.toLocaleTimeString('el-GR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    
    // Login functionality
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const users = safeGetFromStorage('pitsasUsers', []);
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Store current user info in session storage
            sessionStorage.setItem('currentUser', JSON.stringify({
                username: user.username,
                name: user.name
            }));
            
            // Show staff name in the navbar
            staffNameElement.textContent = user.name;
            
            // Hide login, show app
            loginContainer.classList.add('d-none');
            appContainer.classList.remove('d-none');
            
            // Load dashboard data
            loadDashboard();
            
            // Show welcome notification
            showNotification(`Καλώς ήρθατε, ${user.name}!`, 'primary');
        } else {
            showNotification('Λάθος όνομα χρήστη ή κωδικός!', 'danger');
        }
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        appContainer.classList.add('d-none');
        loginContainer.classList.remove('d-none');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    });
    
    // Navigation functionality - Enhanced with breadcrumbs
    dashboardLink.addEventListener('click', function(e) {
        e.preventDefault();
        currentView = 'dashboard';
        showView(dashboardView);
        setActiveLink(dashboardLink);
        loadDashboard();
        updateBreadcrumbs('dashboard');
    });
    
    childrenLink.addEventListener('click', function(e) {
        e.preventDefault();
        currentView = 'children';
        showView(childrenView);
        setActiveLink(childrenLink);
        loadChildren();
        updateBreadcrumbs('children');
    });
    
    transactionsLink.addEventListener('click', function(e) {
        e.preventDefault();
        currentView = 'transactions';
        showView(transactionsView);
        setActiveLink(transactionsLink);
        loadTransactions();
        updateBreadcrumbs('transactions');
    });
    
    statisticsLink.addEventListener('click', function(e) {
        e.preventDefault();
        currentView = 'statistics';
        showView(statisticsView);
        setActiveLink(statisticsLink);
        loadStatistics();
        updateBreadcrumbs('statistics');
    });
    
    // Quick actions
    addChildBtn.addEventListener('click', function() {
        document.getElementById('add-child-form').reset();
        addChildModal.show();
    });
    
    quickDepositBtn.addEventListener('click', function() {
        prepareTransactionModal('deposit');
    });
    
    quickWithdrawBtn.addEventListener('click', function() {
        prepareTransactionModal('withdraw');
    });
    
    viewAllTransactionsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showView(transactionsView);
        setActiveLink(transactionsLink);
        loadTransactions();
    });
    
    backupBtn.addEventListener('click', function() {
        backupModal.show();
    });
    
    // Export functionality
    exportChildrenBtn.addEventListener('click', function() {
        const children = safeGetFromStorage('pitsasChildren', []);
        exportToCSV('pitsas_camp_children.csv', children);
    });
    
    exportTransactionsBtn.addEventListener('click', function() {
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        const children = safeGetFromStorage('pitsasChildren', []);
        
        // Enrich transactions with child names for export
        const enrichedTransactions = transactions.map(t => {
            const child = children.find(c => c.id === t.childId);
            return {
                ...t,
                childName: child ? `${child.firstName} ${child.lastName}` : 'Unknown',
                childCampId: child ? child.campId : 'Unknown'
            };
        });
        
        exportToCSV('pitsas_camp_transactions.csv', enrichedTransactions);
    });
    
    // Save new child
    saveChildBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent any form submission
        const firstName = document.getElementById('child-first-name').value;
        const lastName = document.getElementById('child-last-name').value;
        const age = parseInt(document.getElementById('child-age').value);
        const group = document.getElementById('child-group').value;
        const initialBalance = parseFloat(document.getElementById('child-initial-balance').value);
        const dailyLimit = parseFloat(document.getElementById('child-daily-limit').value) || 0;
        const allowOverride = document.getElementById('child-allow-override').checked;
        const notes = document.getElementById('child-notes').value;
        
        if (!firstName || !lastName || isNaN(age) || !group) {
            showNotification('Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία!', 'warning');
            return;
        }
        
        const children = safeGetFromStorage('pitsasChildren', []);
        
        // Create unique ID
        const year = new Date().getFullYear();
        const count = children.length + 1;
        const initials = firstName.charAt(0) + lastName.charAt(0);
        const uniqueId = `PC${year}-${count.toString().padStart(3, '0')}-${initials.toUpperCase()}`;
        
        const newChild = {     
            id: Date.now().toString(),
            campId: uniqueId,
            firstName,
            lastName,
            age,
            group,
            balance: initialBalance || 0,
            dailyLimit: dailyLimit,
            allowOverride: allowOverride,
            todaySpent: 0,
            lastSpendingReset: new Date().toISOString().split('T')[0], // Today's date
            notes: notes || '',
            createdAt: new Date().toISOString()
        };
        
        children.push(newChild);
        safeSetToStorage('pitsasChildren', children);
        
        // If initial balance is greater than 0, create a deposit transaction
        if (initialBalance > 0) {
            const currentUser = safeParseJSON(sessionStorage.getItem('currentUser'), {});
            const transactions = safeGetFromStorage('pitsasTransactions', []);
            
            const newTransaction = {
                id: Date.now().toString(),
                childId: newChild.id,
                type: 'deposit',
                amount: initialBalance,
                date: new Date().toISOString(),
                staff: currentUser.name,
                notes: 'Αρχικό υπόλοιπο'
            };
            
            transactions.push(newTransaction);
            safeSetToStorage('pitsasTransactions', transactions);
        }
        
        addChildModal.hide();
        
        // Show success notification
        showNotification(`Το παιδί προστέθηκε με επιτυχία! ID: ${uniqueId}`, 'success');
        
        // Reload the appropriate view WITHOUT FULL RELOAD
        if (childrenView.classList.contains('d-none')) {
            // If we're not in children view, just update dashboard stats
            updateDashboardStats();
        } else {
            // If we're in children view, just update the specific child row
            updateChildRowInTable(newChild.id);
        }
        
        // Show ID card for the new child
        setTimeout(() => {
            showIdCard(newChild.id);
        }, 500);
    });
    
    // Save transaction
    saveTransactionBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent any form submission
        const childId = document.getElementById('transaction-child').value;
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const notes = document.getElementById('transaction-notes').value;
        const printReceipt = document.getElementById('print-receipt').checked;
        const overrideLimit = document.getElementById('override-limit') ? 
                              document.getElementById('override-limit').checked : false;
        
        if (!childId || !type || isNaN(amount) || amount <= 0) {
            showNotification('Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία!', 'warning');
            return;
        }
        
        // Get current user
        const currentUser = safeParseJSON(sessionStorage.getItem('currentUser'), {});
        
        // Update child's balance
        const children = safeGetFromStorage('pitsasChildren', []);
        const childIndex = children.findIndex(child => child.id === childId);
        
        if (childIndex === -1) {
            showNotification('Το παιδί δεν βρέθηκε!', 'danger');
            return;
        }
        
        const child = children[childIndex];
        
        // Check if enough balance for withdrawal
        if (type === 'withdraw' && child.balance < amount) {
            showNotification('Δεν υπάρχει επαρκές υπόλοιπο για αυτή την ανάληψη!', 'danger');
            return;
        }
        
        // Check daily limit for withdrawals
        if (type === 'withdraw' && child.dailyLimit > 0) {
            // Επαναφορά ημερήσιου ορίου αν είναι νέα ημέρα
            const today = new Date().toISOString().split('T')[0];
            if (child.lastSpendingReset !== today) {
                child.todaySpent = 0;
                child.lastSpendingReset = today;
            }
            
            const remainingDaily = child.dailyLimit - child.todaySpent;
            
            // Έλεγχος αν το ποσό υπερβαίνει το ημερήσιο όριο
            if (amount > remainingDaily && !overrideLimit) {
                // Εμφάνιση modal επιβεβαίωσης για παράκαμψη
                if (child.allowOverride !== false) { // default to true if undefined
                    showLimitOverrideConfirmation(child, amount, remainingDaily);
                    return;
                } else {
                    showNotification(`Υπέρβαση ημερήσιου ορίου! Διαθέσιμο υπόλοιπο ημέρας: ${remainingDaily.toFixed(2)}€`, 'danger');
                    return;
                }
            }
        }
        
        // Update balance and spending
        const oldBalance = child.balance;
        if (type === 'deposit') {
            child.balance += amount;
        } else {
            child.balance -= amount;
            // Update daily spending for withdrawals
            if (child.dailyLimit > 0) {
                child.todaySpent += amount;
            }
        }
        
        safeSetToStorage('pitsasChildren', children);
        
        // Create transaction record
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        const newTransaction = {
            id: Date.now().toString(),
            childId,
            type,
            amount,
            date: new Date().toISOString(),
            staff: currentUser.name,
            notes: notes || '',
            oldBalance,
            newBalance: child.balance,
            limitOverride: overrideLimit
        };
        
        transactions.push(newTransaction);
        safeSetToStorage('pitsasTransactions', transactions);
        
        transactionModal.hide();
        
        // Show success notification
        const actionText = type === 'deposit' ? 'κατάθεση' : 'ανάληψη';
        showNotification(`Η ${actionText} ολοκληρώθηκε με επιτυχία!`, 'success');
        
        // Print receipt if requested
        if (printReceipt) {
            showReceipt(newTransaction.id);
        }
        
        // UPDATE CURRENT VIEW WITHOUT FULL RELOAD
        if (!dashboardView.classList.contains('d-none')) {
            // Just update dashboard stats, don't reload entire dashboard
            updateDashboardStats();
        } else if (!childrenView.classList.contains('d-none')) {
            // Just update the specific child row, don't reload entire table
            updateChildRowInTable(childId);
        } else if (!transactionsView.classList.contains('d-none')) {
            // Just prepend the new transaction, don't reload entire table
            prependTransactionToTable(newTransaction);
        } else {
            // Just update statistics, don't reload entire stats
            updateStatisticsData();
        }
    });
    
    // Limit override handling
    document.getElementById('confirm-override').addEventListener('change', function() {
        confirmOverrideBtn.disabled = !this.checked;
    });
    
    cancelOverrideBtn.addEventListener('click', function() {
        limitOverrideModal.hide();
        setTimeout(() => {
            transactionModal.show();
        }, 500);
    });
    
    confirmOverrideBtn.addEventListener('click', function() {
        const reason = document.getElementById('override-reason').value;
        if (!reason) {
            showNotification('Παρακαλώ εισάγετε αιτιολογία για την παράκαμψη του ορίου!', 'warning');
            return;
        }
        
        limitOverrideModal.hide();
        
        setTimeout(() => {
            // Προσθήκη της αιτιολογίας στις σημειώσεις
            const currentNotes = document.getElementById('transaction-notes').value;
            document.getElementById('transaction-notes').value = currentNotes + 
                (currentNotes ? '\n' : '') + 
                `[ΠΑΡΑΚΑΜΨΗ ΟΡΙΟΥ] ${reason}`;
            
            // Προσθήκη hidden field για παράκαμψη
            if (!document.getElementById('override-limit')) {
                const overrideInput = document.createElement('input');
                overrideInput.type = 'hidden';
                overrideInput.id = 'override-limit';
                overrideInput.value = 'true';
                document.getElementById('transaction-form').appendChild(overrideInput);
            } else {
                document.getElementById('override-limit').checked = true;
            }
            
            transactionModal.show();
        }, 500);
    });
    
    // Children filters
    document.getElementById('search-children').addEventListener('input', function() {
        filterChildren();
    });
    
    document.getElementById('filter-group').addEventListener('change', function() {
        filterChildren();
    });
    
    document.getElementById('sort-children').addEventListener('change', function() {
        filterChildren();
    });
    
    document.getElementById('reset-filters-btn').addEventListener('click', function() {
        document.getElementById('search-children').value = '';
        document.getElementById('filter-group').value = '';
        document.getElementById('sort-children').value = 'name';
        filterChildren();
    });
    
    // Transaction filters
    document.getElementById('search-transactions').addEventListener('input', function() {
        filterTransactions();
    });
    
    document.getElementById('date-from').addEventListener('change', function() {
        filterTransactions();
    });
    
    document.getElementById('date-to').addEventListener('change', function() {
        filterTransactions();
    });
    
    document.getElementById('transaction-type-filter').addEventListener('change', function() {
        filterTransactions();
    });
    
    // Print buttons
    printReceiptBtn.addEventListener('click', function() {
        printElement('receipt-content');
    });
    
    printIdCardBtn.addEventListener('click', function() {
        printElement('id-card-content');
    });
    
    // Backup functionality
    createBackupBtn.addEventListener('click', function() {
        createBackup();
    });
    
    backupFileInput.addEventListener('change', function() {
        restoreBackupBtn.disabled = !this.files || !this.files[0];
    });
    
    restoreBackupBtn.addEventListener('click', function() {
        restoreBackup();
    });
    
    // Dark mode toggle
    darkModeToggle.addEventListener('click', function() {
        toggleDarkMode();
    });
    
    // Prevent form submissions that might cause refresh
    document.getElementById('add-child-form').addEventListener('submit', function(e) {
        e.preventDefault();
        return false;
    });
    
    document.getElementById('transaction-form').addEventListener('submit', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Helper functions
    function safeParseJSON(jsonString, defaultValue = null) {
        try {
            return jsonString ? JSON.parse(jsonString) : defaultValue;
        } catch (e) {
            console.warn('Error parsing JSON:', e);
            return defaultValue;
        }
    }
    
    function safeGetFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn(`Error getting ${key} from localStorage:`, e);
            return defaultValue;
        }
    }
    
    function safeSetToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            
            // Update lastBackup timestamp when saving children or transactions
            if (key === 'pitsasChildren' || key === 'pitsasTransactions') {
                updateLastBackupTimestamp();
            }
            
            return true;
        } catch (e) {
            console.error(`Error setting ${key} to localStorage:`, e);
            return false;
        }
    }
    
    // Helper function to update the last backup timestamp when data changes
    function updateLastBackupTimestamp() {
        try {
            const settings = safeGetFromStorage('pitsasSettings', {});
            settings.lastBackup = new Date().toISOString();
            localStorage.setItem('pitsasSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Error updating lastBackup timestamp:', e);
        }
    }
    
    // Helper function to ensure lastBackup timestamp exists
    function ensureLastBackupTimestamp() {
        try {
            const settings = safeGetFromStorage('pitsasSettings', {});
            const children = safeGetFromStorage('pitsasChildren', []);
            const transactions = safeGetFromStorage('pitsasTransactions', []);
            
            // If we have data but no lastBackup timestamp, set it to current time
            if ((children.length > 0 || transactions.length > 0) && !settings.lastBackup) {
                settings.lastBackup = new Date().toISOString();
                localStorage.setItem('pitsasSettings', JSON.stringify(settings));
                console.log('Initialized missing lastBackup timestamp');
            }
        } catch (e) {
            console.warn('Error ensuring lastBackup timestamp:', e);
        }
    }
    
    // Helper function to refresh current view without page reload
    function refreshCurrentView() {
        try {
            if (currentView === 'dashboard') {
                loadDashboard();
            } else if (currentView === 'children') {
                loadChildren();
            } else if (currentView === 'transactions') {
                loadTransactions();
            } else if (currentView === 'statistics') {
                loadStatistics();
            }
        } catch (error) {
            console.warn('Error refreshing current view:', error);
        }
    }
    
    function showView(view) {
        dashboardView.classList.add('d-none');
        childrenView.classList.add('d-none');
        transactionsView.classList.add('d-none');
        statisticsView.classList.add('d-none');
        
        view.classList.remove('d-none');
    }
    
    function setActiveLink(link) {
        dashboardLink.classList.remove('active');
        childrenLink.classList.remove('active');
        transactionsLink.classList.remove('active');
        statisticsLink.classList.remove('active');
        
        link.classList.add('active');
    }
    
    function loadDashboard() {
        const children = safeGetFromStorage('pitsasChildren', []);
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        
        // Update dashboard stats
        document.getElementById('total-children').textContent = children.length;
        
        const totalBalance = children.reduce((sum, child) => sum + child.balance, 0);
        document.getElementById('total-balance').textContent = totalBalance.toFixed(2) + '€';
        
        // Count today's transactions
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = transactions.filter(t => 
            t.date.startsWith(today)
        ).length;
        
        document.getElementById('today-transactions').textContent = todayTransactions;
        
        // Count active groups
        const uniqueGroups = [...new Set(children.map(child => child.group))];
        document.getElementById('active-groups').textContent = uniqueGroups.length;
        
        // Update navbar stats
        updateNavbarStats(children.length, totalBalance, todayTransactions);
        
        // Recent transactions (last 5)
        const recentTransactions = [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
            
        const transactionsList = document.getElementById('recent-transactions-list');
        transactionsList.innerHTML = '';
        
        if (recentTransactions.length === 0) {
            transactionsList.innerHTML = '<li class="list-group-item text-center text-muted">Δεν υπάρχουν συναλλαγές</li>';
        } else {
            recentTransactions.forEach(transaction => {
                const child = children.find(c => c.id === transaction.childId);
                if (!child) return;
                
                const childName = `${child.firstName} ${child.lastName}`;
                const date = new Date(transaction.date).toLocaleString('el-GR');
                const typeClass = transaction.type === 'deposit' ? 'text-success' : 'text-danger';
                const typeIcon = transaction.type === 'deposit' ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill';
                const typeText = transaction.type === 'deposit' ? 'Κατάθεση' : 'Ανάληψη';
                
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${childName}</div>
                            <small class="text-muted">${date}</small>
                        </div>
                        <div>
                            <span class="${typeClass}">
                                <i class="bi ${typeIcon}"></i> ${typeText}
                            </span>
                            <div class="fw-bold ${typeClass}">${transaction.amount.toFixed(2)}€</div>
                        </div>
                    </div>
                `;
                
                transactionsList.appendChild(li);
            });
        }
        
        // Create dashboard chart
        createDashboardChart();
    }
    
    function createDashboardChart() {
        const children = safeGetFromStorage('pitsasChildren', []);
        
        // Group children by group
        const groupData = {};
        children.forEach(child => {
            if (!groupData[child.group]) {
                groupData[child.group] = {
                    count: 0,
                    totalBalance: 0
                };
            }
            groupData[child.group].count++;
            groupData[child.group].totalBalance += child.balance;
        });
        
        // Prepare data for chart
        const labels = Object.keys(groupData);
        const data = labels.map(group => groupData[group].totalBalance);
        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
        ];
        
        // Get the canvas element
        const ctx = document.getElementById('dashboard-chart');
        
        // Destroy existing chart if it exists
        if (window.dashboardChart) {
            window.dashboardChart.destroy();
        }
        
        // Create new chart
        window.dashboardChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Συνολικό Υπόλοιπο (€)',
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Συνολικό Υπόλοιπο ανά Ομάδα'
                    }
                }
            }
        });
    }
    
    function loadChildren(page = 1) {
        const children = safeGetFromStorage('pitsasChildren', []);
        
        // Sort children by name by default
        children.sort((a, b) => {
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        });
        
        // Set up pagination
        const settings = safeGetFromStorage('pitsasSettings', { itemsPerPage: 10 });
        const itemsPerPage = settings.itemsPerPage;
        const totalPages = Math.ceil(children.length / itemsPerPage);
        
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = children.slice(start, end);
        
        renderChildrenTable(pageItems);
        renderPagination('children-pagination', page, totalPages, loadChildren);
    }
    
    function filterChildren() {
        const searchTerm = document.getElementById('search-children').value.toLowerCase();
        const groupFilter = document.getElementById('filter-group').value;
        const sortOption = document.getElementById('sort-children').value;
        
        const children = safeGetFromStorage('pitsasChildren', []);
        
        // Filter by search term and group
        let filteredChildren = children.filter(child => {
            const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm) || 
                                 (child.campId && child.campId.toLowerCase().includes(searchTerm)) ||
                                 child.group.toLowerCase().includes(searchTerm);
            
            const matchesGroup = !groupFilter || child.group === groupFilter;
            
            return matchesSearch && matchesGroup;
        });
        
        // Sort the filtered results
        switch(sortOption) {
            case 'name':
                filteredChildren.sort((a, b) => 
                    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
                );
                break;
            case 'balance-high':
                filteredChildren.sort((a, b) => b.balance - a.balance);
                break;
            case 'balance-low':
                filteredChildren.sort((a, b) => a.balance - b.balance);
                break;
            case 'age':
                filteredChildren.sort((a, b) => a.age - b.age);
                break;
        }
        
        renderChildrenTable(filteredChildren);
        
        // Remove pagination when filtering
        document.getElementById('children-pagination').innerHTML = '';
    }
    
    function renderChildrenTable(children) {
        const tableBody = document.getElementById('children-table-body');
        tableBody.innerHTML = '';
        
        if (children.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" class="text-center">Δεν υπάρχουν καταχωρημένα παιδιά</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        children.forEach(child => {
            // Εξασφάλιση ότι τα απαραίτητα πεδία υπάρχουν (για legacy data)
            if (typeof child.dailyLimit === 'undefined') {
                child.dailyLimit = 5; // Προεπιλεγμένο όριο
            }
            if (typeof child.todaySpent === 'undefined') {
                child.todaySpent = 0;
            }
            if (typeof child.allowOverride === 'undefined') {
                child.allowOverride = true;
            }
            
            // Υπολογισμός διαθέσιμου ημερήσιου ορίου
            const remainingLimit = getRemainingDailyLimit(child);
            
            // Εμφάνιση του ορίου
            let limitDisplay;
            let limitClass;
            
            if (child.dailyLimit <= 0) {
                limitDisplay = 'Απεριόριστο';
                limitClass = 'text-muted';
            } else if (remainingLimit === Infinity || isNaN(remainingLimit)) {
                limitDisplay = 'Απεριόριστο';
                limitClass = 'text-muted';
            } else {
                const percentage = (remainingLimit / child.dailyLimit) * 100;
                limitDisplay = `
                    <div>${remainingLimit.toFixed(2)}€ / ${child.dailyLimit.toFixed(2)}€</div>
                    <div class="progress daily-limit-progress">
                        <div class="progress-bar bg-${percentage < 25 ? 'danger' : percentage < 50 ? 'warning' : 'success'}" 
                             style="width: ${percentage}%"></div>
                    </div>
                `;
                
                if (percentage < 25) {
                    limitClass = 'daily-limit-warning';
                } else if (percentage < 50) {
                    limitClass = 'daily-limit-caution';
                } else {
                    limitClass = 'daily-limit-ok';
                }
            }
            
            const row = document.createElement('tr');
            row.className = 'child-row';
            row.innerHTML = `
                <td><span class="badge bg-primary">${child.campId || 'N/A'}</span></td>
                <td>${child.firstName}</td>
                <td>${child.lastName}</td>
                <td>${child.age}</td>
                <td><span class="badge bg-secondary">${child.group}</span></td>
                <td class="fw-bold">${child.balance.toFixed(2)}€</td>
                <td class="${limitClass}">${limitDisplay}</td>
                <td>
                    <button class="btn btn-sm btn-success action-btn deposit-btn" data-id="${child.id}" title="Κατάθεση">
                        <i class="bi bi-cash-coin"></i>
                    </button>
                    <button class="btn btn-sm btn-warning action-btn withdraw-btn" data-id="${child.id}" title="Ανάληψη">
                        <i class="bi bi-cash"></i>
                    </button>
                    <button class="btn btn-sm btn-info action-btn history-btn" data-id="${child.id}" title="Ιστορικό">
                        <i class="bi bi-clock-history"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary action-btn id-card-btn" data-id="${child.id}" title="Κάρτα ID">
                        <i class="bi bi-person-badge"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.deposit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const childId = this.dataset.id;
                prepareTransactionModal('deposit', childId);
            });
        });
        
        document.querySelectorAll('.withdraw-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const childId = this.dataset.id;
                prepareTransactionModal('withdraw', childId);
            });
        });
        
        document.querySelectorAll('.history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const childId = this.dataset.id;
                showChildHistory(childId);
            });
        });
        
        document.querySelectorAll('.id-card-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const childId = this.dataset.id;
                showIdCard(childId);
            });
        });
    }
    
    function loadTransactions(page = 1) {
        // Set default date values if not set
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');
        
        if (!dateFrom.value) {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            dateFrom.value = oneWeekAgo.toISOString().split('T')[0];
        }
        
        if (!dateTo.value) {
            const today = new Date();
            dateTo.value = today.toISOString().split('T')[0];
        }
        
        filterTransactions(page);
    }
    
    function filterTransactions(page = 1) {
        const searchTerm = document.getElementById('search-transactions').value.toLowerCase();
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        const typeFilter = document.getElementById('transaction-type-filter').value;
        
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        const children = safeGetFromStorage('pitsasChildren', []);
        
        let filteredTransactions = [...transactions];
        
        // Filter by date
        if (dateFrom) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.date.split('T')[0] >= dateFrom
            );
        }
        
        if (dateTo) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.date.split('T')[0] <= dateTo
            );
        }
        
        // Filter by type
        if (typeFilter) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.type === typeFilter
            );
        }
        
        // Filter by search term
        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(t => {
                const child = children.find(c => c.id === t.childId);
                const childName = child ? `${child.firstName} ${child.lastName}`.toLowerCase() : '';
                const childId = child ? (child.campId || '').toLowerCase() : '';
                
                return childName.includes(searchTerm) || 
                       childId.includes(searchTerm) ||
                       t.staff.toLowerCase().includes(searchTerm) || 
                       (t.notes && t.notes.toLowerCase().includes(searchTerm));
            });
        }
        
        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Set up pagination
        const settings = safeGetFromStorage('pitsasSettings', { itemsPerPage: 10 });
        const itemsPerPage = settings.itemsPerPage;
        const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
        
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredTransactions.slice(start, end);
        
        renderTransactionsTable(pageItems);
        renderPagination('transactions-pagination', page, totalPages, filterTransactions);
    }
    
    function renderTransactionsTable(transactions) {
        const tableBody = document.getElementById('transactions-table-body');
        tableBody.innerHTML = '';
        
        if (transactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" class="text-center">Δεν βρέθηκαν συναλλαγές</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        const children = safeGetFromStorage('pitsasChildren', []);
        
        transactions.forEach(transaction => {
            const child = children.find(c => c.id === transaction.childId);
            const childName = child ? `${child.firstName} ${child.lastName}` : 'Άγνωστο';
            const childId = child ? (child.campId || 'N/A') : 'N/A';
            const date = new Date(transaction.date).toLocaleString('el-GR');
            const typeClass = transaction.type === 'deposit' ? 'text-success' : 'text-danger';
            const typeText = transaction.type === 'deposit' ? 'Κατάθεση' : 'Ανάληψη';
            
            // Έλεγχος για παράκαμψη ορίου
            const overrideIcon = transaction.limitOverride ? 
                '<i class="bi bi-exclamation-triangle-fill text-warning ms-1" title="Παράκαμψη ορίου"></i>' : '';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>${childName}</td>
                <td><span class="badge bg-primary">${childId}</span></td>
                <td class="${typeClass}"><i class="bi ${transaction.type === 'deposit' ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill'}"></i> ${typeText} ${overrideIcon}</td>
                <td class="${typeClass} fw-bold">${transaction.amount.toFixed(2)}€</td>
                <td>${transaction.staff}</td>
                <td>${transaction.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info action-btn view-receipt-btn" data-id="${transaction.id}" title="Προβολή Απόδειξης">
                        <i class="bi bi-receipt"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners for receipt buttons
        document.querySelectorAll('.view-receipt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const transactionId = this.dataset.id;
                showReceipt(transactionId);
            });
        });
    }
    
    function renderPagination(containerId, currentPage, totalPages, callback) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
        container.appendChild(prevLi);
        
        if (currentPage > 1) {
            prevLi.addEventListener('click', e => {
                e.preventDefault();
                callback(currentPage - 1);
            });
        }
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            
            li.addEventListener('click', e => {
                e.preventDefault();
                callback(i);
            });
            
            container.appendChild(li);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
        container.appendChild(nextLi);
        
        if (currentPage < totalPages) {
            nextLi.addEventListener('click', e => {
                e.preventDefault();
                callback(currentPage + 1);
            });
        }
    }
    
    function prepareTransactionModal(type, childId = null) {
        // Reset form
        document.getElementById('transaction-form').reset();
        
        // Remove any previous override input
        const previousOverride = document.getElementById('override-limit');
        if (previousOverride) {
            previousOverride.remove();
        }
        
        // Get modal element
        const modalElement = document.getElementById('transactionModal');
        const modalContent = modalElement.querySelector('.modal-content');
        
        // Remove previous modal classes
        modalContent.classList.remove('modal-deposit', 'modal-withdraw');
        
        // Set modal title and styling based on transaction type
        let title, icon;
        if (type === 'deposit') {
            title = 'Νέα Κατάθεση';
            icon = '<i class="bi bi-cash-coin me-2"></i>';
        } else {
            title = 'Νέα Ανάληψη';
            icon = '<i class="bi bi-cash me-2"></i>';
        }
        document.getElementById('transaction-modal-title').innerHTML = icon + title;
        
        // Add appropriate CSS class for styling
        if (type === 'deposit') {
            modalContent.classList.add('modal-deposit');
        } else {
            modalContent.classList.add('modal-withdraw');
        }
        
        // Set transaction type
        document.getElementById('transaction-type').value = type;
        
        // Populate children dropdown
        const childSelect = document.getElementById('transaction-child');
        childSelect.innerHTML = '<option value="">Επιλέξτε παιδί</option>';
        
        const children = safeGetFromStorage('pitsasChildren', []);
        
        // Sort children by name for the dropdown
        children.sort((a, b) => {
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        });
        
        children.forEach(child => {
            // Προσθήκη πληροφοριών ημερήσιου ορίου για αναλήψεις
            let limitInfo = '';
            if (type === 'withdraw' && (child.dailyLimit || 0) > 0) {
                const remainingLimit = getRemainingDailyLimit(child);
                limitInfo = ` - Όριο: ${remainingLimit.toFixed(2)}€/${(child.dailyLimit || 0).toFixed(2)}€`;
            }
            
            const option = document.createElement('option');
            option.value = child.id;
            option.textContent = `${child.firstName} ${child.lastName} (${child.group}) - ${child.campId || 'No ID'}${limitInfo}`;
            childSelect.appendChild(option);
        });
        
        // If childId is provided, select it in the dropdown
        if (childId) {
            childSelect.value = childId;
        }
        
        transactionModal.show();
    }
    
    function showChildHistory(childId) {
        // Set active tab to transactions
        currentView = 'transactions';
        showView(transactionsView);
        setActiveLink(transactionsLink);
        
        // Clear search and set date range to all
        document.getElementById('search-transactions').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        document.getElementById('transaction-type-filter').value = '';
        
        // Find child's name for search
        const children = safeGetFromStorage('pitsasChildren', []);
        const child = children.find(c => c.id === childId);
        
        if (child) {
            // Set search to child's name to filter transactions
            document.getElementById('search-transactions').value = `${child.firstName} ${child.lastName}`;
            filterTransactions();
            
            // Show notification
            showNotification(`Προβολή ιστορικού για: ${child.firstName} ${child.lastName}`, 'info');
        }
    }
    
    function showReceipt(transactionId) {
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            showNotification('Η συναλλαγή δεν βρέθηκε!', 'danger');
            return;
        }
        
        const children = safeGetFromStorage('pitsasChildren', []);
        const child = children.find(c => c.id === transaction.childId);
        
        if (!child) {
            showNotification('Το παιδί δεν βρέθηκε!', 'danger');
            return;
        }
        
        // Populate receipt data
        document.getElementById('receipt-transaction-id').textContent = transaction.id;
        document.getElementById('receipt-date').textContent = new Date(transaction.date).toLocaleString('el-GR');
        document.getElementById('receipt-child-name').textContent = `${child.firstName} ${child.lastName}`;
        document.getElementById('receipt-child-id').textContent = child.campId || 'N/A';
        document.getElementById('receipt-type').textContent = transaction.type === 'deposit' ? 'Κατάθεση' : 'Ανάληψη';
        document.getElementById('receipt-type').className = transaction.type === 'deposit' ? 'text-success' : 'text-danger';
        document.getElementById('receipt-amount').textContent = `${transaction.amount.toFixed(2)}€`;
        document.getElementById('receipt-amount').className = transaction.type === 'deposit' ? 'text-success' : 'text-danger';
        document.getElementById('receipt-balance').textContent = `${transaction.newBalance.toFixed(2)}€`;
        document.getElementById('receipt-staff').textContent = transaction.staff;
        document.getElementById('receipt-notes-text').textContent = transaction.notes || '-';
        
        // Προσθήκη πληροφοριών ορίου (μόνο για αναλήψεις)
        const limitInfoElement = document.getElementById('receipt-limit-info');
        if (transaction.type === 'withdraw' && (child.dailyLimit || 0) > 0) {
            // Δημιουργία HTML για το όριο
            let limitHtml = `
                <div class="receipt-item">
                    <span>Ημερήσιο Όριο:</span>
                    <span>${(child.dailyLimit || 0).toFixed(2)}€</span>
                </div>
            `;
            
            // Εάν υπήρξε παράκαμψη ορίου
            if (transaction.limitOverride) {
                limitHtml += `
                    <div class="receipt-item text-warning">
                        <span><i class="bi bi-exclamation-triangle-fill"></i> Παράκαμψη Ορίου:</span>
                        <span>Εγκρίθηκε</span>
                    </div>
                `;
            }
            
            limitInfoElement.innerHTML = limitHtml;
            limitInfoElement.classList.remove('d-none');
        } else {
            limitInfoElement.classList.add('d-none');
        }
        
        // Show receipt modal
        receiptModal.show();
        
        // Add Enter key listener for closing receipt
        const receiptEnterHandler = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                receiptModal.hide();
                document.removeEventListener('keydown', receiptEnterHandler);
            }
        };
        
        // Add the event listener when modal is shown
        document.addEventListener('keydown', receiptEnterHandler);
        
        // Remove event listener when modal is hidden
        const receiptModalElement = document.getElementById('receiptModal');
        receiptModalElement.addEventListener('hidden.bs.modal', function() {
            document.removeEventListener('keydown', receiptEnterHandler);
        }, { once: true });
    }
    
    function showIdCard(childId) {
        const children = safeGetFromStorage('pitsasChildren', []);
        const child = children.find(c => c.id === childId);
        
        if (!child) {
            showNotification('Το παιδί δεν βρέθηκε!', 'danger');
            return;
        }
        
        // Populate ID card data
        document.getElementById('id-card-number').textContent = child.campId || 'No ID';
        document.getElementById('id-card-name').textContent = `${child.firstName} ${child.lastName}`;
        document.getElementById('id-card-group').textContent = `Ομάδα: ${child.group}`;
        document.getElementById('id-card-age').textContent = `Ηλικία: ${child.age}`;
        
        // Show ID card modal
        idCardModal.show();
        
        // Add Enter key listener for closing ID card
        const idCardEnterHandler = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                idCardModal.hide();
                document.removeEventListener('keydown', idCardEnterHandler);
            }
        };
        
        // Add the event listener when modal is shown
        document.addEventListener('keydown', idCardEnterHandler);
        
        // Remove event listener when modal is hidden
        const idCardModalElement = document.getElementById('idCardModal');
        idCardModalElement.addEventListener('hidden.bs.modal', function() {
            document.removeEventListener('keydown', idCardEnterHandler);
        }, { once: true });
    }
    
    function loadStatistics() {
        const children = safeGetFromStorage('pitsasChildren', []);
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        
        // Summary statistics
        const totalChildren = children.length;
        const totalBalance = children.reduce((sum, child) => sum + child.balance, 0);
        const totalDeposits = transactions
            .filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = transactions
            .filter(t => t.type === 'withdraw')
            .reduce((sum, t) => sum + t.amount, 0);
        
        document.getElementById('stat-total-children').textContent = totalChildren;
        document.getElementById('stat-total-balance').textContent = totalBalance.toFixed(2) + '€';
        document.getElementById('stat-total-deposits').textContent = totalDeposits.toFixed(2) + '€';
        document.getElementById('stat-total-withdrawals').textContent = totalWithdrawals.toFixed(2) + '€';
        
        // Group statistics
        const groupStats = {};
        children.forEach(child => {
            if (!groupStats[child.group]) {
                groupStats[child.group] = {
                    count: 0,
                    totalBalance: 0,
                    deposits: 0,
                    withdrawals: 0
                };
            }
            groupStats[child.group].count++;
            groupStats[child.group].totalBalance += child.balance;
        });
        
        // Add transactions to group stats
        transactions.forEach(t => {
            const child = children.find(c => c.id === t.childId);
            if (!child) return;
            
            if (t.type === 'deposit') {
                groupStats[child.group].deposits += t.amount;
            } else {
                groupStats[child.group].withdrawals += t.amount;
            }
        });
        
        // Render group stats table
        const statsTableBody = document.getElementById('group-stats-table-body');
        statsTableBody.innerHTML = '';
        
        Object.keys(groupStats).forEach(group => {
            const stats = groupStats[group];
            const avgBalance = stats.count > 0 ? stats.totalBalance / stats.count : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${group}</td>
                <td>${stats.count}</td>
                <td>${stats.totalBalance.toFixed(2)}€</td>
                <td>${avgBalance.toFixed(2)}€</td>
                <td class="text-success">${stats.deposits.toFixed(2)}€</td>
                <td class="text-danger">${stats.withdrawals.toFixed(2)}€</td>
            `;
            
            statsTableBody.appendChild(row);
        });
        
        // Στατιστικά ημερήσιων ορίων
        const childrenWithLimits = children.filter(c => c.dailyLimit > 0);
        const avgDailyLimit = childrenWithLimits.length > 0 
            ? childrenWithLimits.reduce((sum, c) => sum + c.dailyLimit, 0) / childrenWithLimits.length 
            : 0;
        
        // Παιδιά που έχουν φτάσει κοντά στο όριό τους σήμερα
        const nearLimitChildren = childrenWithLimits.filter(c => {
            const remaining = getRemainingDailyLimit(c);
            return remaining < (c.dailyLimit * 0.25); // Λιγότερο από 25% υπόλοιπο
        });
        
        // Παιδιά με παρακάμψεις ορίων
        const limitOverrides = transactions.filter(t => t.limitOverride).length;
        
        // Ενημέρωση του HTML με τα στατιστικά ορίων
        const limitStatsContainer = document.getElementById('limit-stats-container');
        limitStatsContainer.innerHTML = `
            <div class="card shadow-sm mb-4">
                <div class="card-header">
                    <h5>Στατιστικά Ημερήσιων Ορίων</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card bg-light mb-3">
                                <div class="card-body text-center">
                                    <h6 class="card-title">Παιδιά με Όρια</h6>
                                    <p class="display-6">${childrenWithLimits.length}</p>
                                    <small class="text-muted">από ${children.length} συνολικά</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-light mb-3">
                                <div class="card-body text-center">
                                    <h6 class="card-title">Μέσο Όριο</h6>
                                    <p class="display-6">${avgDailyLimit.toFixed(2)}€</p>
                                    <small class="text-muted">ανά παιδί</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-light mb-3">
                                <div class="card-body text-center">
                                    <h6 class="card-title">Σχεδόν στο Όριο</h6>
                                    <p class="display-6">${nearLimitChildren.length}</p>
                                    <small class="text-muted">παιδιά σήμερα</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-light mb-3">
                                <div class="card-body text-center">
                                    <h6 class="card-title">Παρακάμψεις</h6>
                                    <p class="display-6">${limitOverrides}</p>
                                    <small class="text-muted">συνολικά</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-responsive mt-3">
                        <h6 class="mb-3">Παιδιά κοντά στο ημερήσιο όριό τους:</h6>
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Παιδί</th>
                                    <th>Ομάδα</th>
                                    <th>Ημερήσιο Όριο</th>
                                    <th>Υπόλοιπο Ημέρας</th>
                                    <th>Ποσοστό</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${nearLimitChildren.length === 0 ? 
                                  '<tr><td colspan="5" class="text-center">Δεν υπάρχουν παιδιά κοντά στο όριό τους σήμερα</td></tr>' : 
                                  nearLimitChildren.map(c => {
                                    const remaining = getRemainingDailyLimit(c);
                                    const percentage = Math.round((remaining / c.dailyLimit) * 100);
                                    return `
                                        <tr>
                                            <td>${c.firstName} ${c.lastName}</td>
                                            <td>${c.group}</td>
                                            <td>${c.dailyLimit.toFixed(2)}€</td>
                                            <td>${remaining.toFixed(2)}€</td>
                                            <td>
                                                <div class="progress">
                                                    <div class="progress-bar bg-${percentage < 25 ? 'danger' : percentage < 50 ? 'warning' : 'success'}" 
                                                         style="width: ${percentage}%">
                                                        ${percentage}%
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                  }).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Create charts
        createGroupChart();
        createTransactionsChart();
        
        // Top balances list
        const topBalanceChildren = [...children]
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 5);
            
        const topBalanceList = document.getElementById('top-balance-list');
        topBalanceList.innerHTML = '';
        
        topBalanceChildren.forEach(child => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <span class="badge bg-primary me-2">${child.campId || 'N/A'}</span>
                    ${child.firstName} ${child.lastName}
                    <small class="text-muted ms-2">(${child.group})</small>
                </div>
                <span class="badge bg-success rounded-pill">${child.balance.toFixed(2)}€</span>
            `;
            
            topBalanceList.appendChild(li);
        });
        
        // Most active children list
        const childTransactionCounts = {};
        transactions.forEach(t => {
            if (!childTransactionCounts[t.childId]) {
                childTransactionCounts[t.childId] = 0;
            }
            childTransactionCounts[t.childId]++;
        });
        
        const topTransactionChildren = Object.keys(childTransactionCounts)
            .map(childId => {
                const child = children.find(c => c.id === childId);
                return {
                    ...child,
                    transactionCount: childTransactionCounts[childId]
                };
            })
            .filter(child => child.firstName) // Filter out any undefined children
            .sort((a, b) => b.transactionCount - a.transactionCount)
            .slice(0, 5);
            
        const topTransactionsList = document.getElementById('top-transactions-list');
        topTransactionsList.innerHTML = '';
        
        topTransactionChildren.forEach(child => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <span class="badge bg-primary me-2">${child.campId || 'N/A'}</span>
                    ${child.firstName} ${child.lastName}
                    <small class="text-muted ms-2">(${child.group})</small>
                </div>
                <span class="badge bg-info rounded-pill">${child.transactionCount} συναλλαγές</span>
            `;
            
            topTransactionsList.appendChild(li);
        });
    }
    
    function createGroupChart() {
        const children = safeGetFromStorage('pitsasChildren', []);
        
        // Count children by group
        const groupCounts = {};
        children.forEach(child => {
            if (!groupCounts[child.group]) {
                groupCounts[child.group] = 0;
            }
            groupCounts[child.group]++;
        });
        
        // Prepare data for chart
        const labels = Object.keys(groupCounts);
        const data = labels.map(group => groupCounts[group]);
        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
        ];
        
        // Get the canvas element
        const ctx = document.getElementById('group-chart');
        
        // Destroy existing chart if it exists
        if (window.groupChart) {
            window.groupChart.destroy();
        }
        
        // Create new chart
        window.groupChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: 'Κατανομή Παιδιών ανά Ομάδα'
                    }
                }
            }
        });
    }
    
    function createTransactionsChart() {
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        
        // Group transactions by date
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const depositsData = last7Days.map(date => {
            return transactions
                .filter(t => t.date.startsWith(date) && t.type === 'deposit')
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        const withdrawalsData = last7Days.map(date => {
            return transactions
                .filter(t => t.date.startsWith(date) && t.type === 'withdraw')
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        // Format dates for display
        const formattedDates = last7Days.map(date => {
            const parts = date.split('-');
            return `${parts[2]}/${parts[1]}`;
        });
        
        // Get the canvas element
        const ctx = document.getElementById('transactions-chart');
        
        // Destroy existing chart if it exists
        if (window.transactionsChart) {
            window.transactionsChart.destroy();
        }
        
        // Create new chart
        window.transactionsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedDates,
                datasets: [
                    {
                        label: 'Καταθέσεις (€)',
                        data: depositsData,
                        borderColor: 'rgba(40, 167, 69, 0.7)',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Αναλήψεις (€)',
                        data: withdrawalsData,
                        borderColor: 'rgba(220, 53, 69, 0.7)',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.1,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Συναλλαγές τελευταίων 7 ημερών'
                    }
                }
            }
        });
    }
    
    function exportToCSV(filename, data) {
        if (!data.length) {
            showNotification('Δεν υπάρχουν δεδομένα για εξαγωγή!', 'warning');
            return;
        }
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add headers
        const headers = Object.keys(data[0]);
        csvContent += headers.join(",") + "\n";
        
        // Add data
        data.forEach(item => {
            const row = headers.map(header => {
                let value = item[header] || '';
                
                // Handle special characters
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""');
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        value = `"${value}"`;
                    }
                }
                return value;
            });
            csvContent += row.join(",") + "\n";
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Τα δεδομένα εξήχθησαν επιτυχώς ως ${filename}`, 'success');
    }
    
    function printElement(elementId) {
        const printContents = document.getElementById(elementId).innerHTML;
        const originalContents = document.body.innerHTML;
        
        document.body.innerHTML = `
            <style>
                body { font-family: Arial, sans-serif; }
                .receipt-container, .id-card { margin: 0 auto; }
                @media print {
                    body { margin: 0; padding: 0; }
                    .receipt-container, .id-card { page-break-inside: avoid; }
                }
            </style>
            ${printContents}
        `;
        
        window.print();
        document.body.innerHTML = originalContents;
        
        // Reinitialize Bootstrap components without page reload
        setTimeout(() => {
            // Reinitialize Bootstrap tooltips and popovers
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
            
            const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
            const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
            
            // Refresh current view
            if (currentView === 'dashboard') {
                showView(dashboardView);
                setActiveLink(dashboardLink);
            } else if (currentView === 'children') {
                showView(childrenView);
                setActiveLink(childrenLink);
                loadChildren();
            } else if (currentView === 'transactions') {
                showView(transactionsView);
                setActiveLink(transactionsLink);
                loadTransactions();
            } else if (currentView === 'statistics') {
                showView(statisticsView);
                setActiveLink(statisticsLink);
                loadStatistics();
            }
        }, 100);
    }
    
    function createBackup() {
        const backup = {
            children: safeGetFromStorage('pitsasChildren', []),
            transactions: safeGetFromStorage('pitsasTransactions', []),
            settings: safeGetFromStorage('pitsasSettings', {}),
            timestamp: new Date().toISOString()
        };
        
        const backupString = JSON.stringify(backup);
        const blob = new Blob([backupString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const date = new Date().toISOString().split('T')[0];
        const filename = `pitsas_camp_backup_${date}.json`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update last backup timestamp
        const settings = safeGetFromStorage('pitsasSettings', {});
        settings.lastBackup = new Date().toISOString();
        safeSetToStorage('pitsasSettings', settings);
        
        showNotification('Το αντίγραφο ασφαλείας δημιουργήθηκε επιτυχώς!', 'success');
    }
    
    function restoreBackup() {
        const file = backupFileInput.files[0];
        if (!file) {
            showNotification('Παρακαλώ επιλέξτε ένα αρχείο αντιγράφου ασφαλείας!', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const backup = JSON.parse(e.target.result);
                
                // Validate backup data
                if (!backup.children || !backup.transactions || !backup.settings) {
                    throw new Error('Μη έγκυρο αρχείο αντιγράφου ασφαλείας!');
                }
                
                // Check if backup is older than current data
                const currentSettings = safeGetFromStorage('pitsasSettings', {});
                const backupTimestamp = backup.timestamp ? new Date(backup.timestamp) : new Date(0);
                const currentLastBackup = currentSettings.lastBackup ? new Date(currentSettings.lastBackup) : new Date(0);
                
                // Check if current data has any transactions or children
                const currentChildren = safeGetFromStorage('pitsasChildren', []);
                const currentTransactions = safeGetFromStorage('pitsasTransactions', []);
                const hasCurrentData = currentChildren.length > 0 || currentTransactions.length > 0;
                
                let shouldConfirm = false;
                let confirmMessage = '';
                
                if (hasCurrentData) {
                    if (backupTimestamp < currentLastBackup) {
                        // Backup is older than current data
                        const backupDate = backupTimestamp.toLocaleString('el-GR');
                        const currentDate = currentLastBackup.toLocaleString('el-GR');
                        
                        confirmMessage = `⚠️ ΠΡΟΣΟΧΗ: Το backup που προσπαθείτε να φορτώσετε είναι παλαιότερο από τα τρέχοντα δεδομένα!\n\n` +
                                       `📅 Backup: ${backupDate}\n` +
                                       `📅 Τρέχοντα δεδομένα: ${currentDate}\n\n` +
                                       `Η επαναφορά θα αντικαταστήσει τα νεότερα δεδομένα με τα παλαιότερα.\n\n` +
                                       `Είστε σίγουροι ότι θέλετε να συνεχίσετε;`;
                        shouldConfirm = true;
                    } else if (backupTimestamp > currentLastBackup) {
                        // Backup is newer than current data - still confirm but with different message
                        const backupDate = backupTimestamp.toLocaleString('el-GR');
                        
                        confirmMessage = `📥 Επαναφορά από νεότερο backup\n\n` +
                                       `📅 Backup: ${backupDate}\n\n` +
                                       `Τα τρέχοντα δεδομένα θα αντικατασταθούν. Συνέχεια;`;
                        shouldConfirm = true;
                    } else {
                        // Same timestamp or very close - minimal confirmation
                        confirmMessage = `Επαναφορά δεδομένων από backup. Συνέχεια;`;
                        shouldConfirm = true;
                    }
                } else {
                    // No current data - proceed without detailed confirmation
                    confirmMessage = `Φόρτωση δεδομένων από backup. Συνέχεια;`;
                    shouldConfirm = true;
                }
                
                // Show confirmation only if needed
                let shouldProceed = true;
                if (shouldConfirm) {
                    shouldProceed = await showConfirmModal('Επιβεβαίωση επαναφοράς', confirmMessage);
                }
                
                if (shouldProceed) {
                    // Restore data
                    safeSetToStorage('pitsasChildren', backup.children);
                    safeSetToStorage('pitsasTransactions', backup.transactions);
                    safeSetToStorage('pitsasSettings', backup.settings);
                    
                    showNotification('Τα δεδομένα επαναφέρθηκαν επιτυχώς!', 'success');
                    
                    // Refresh views instead of reloading the page
                    setTimeout(() => {
                        // Refresh all views to show restored data
                        refreshCurrentView();
                        
                        // If we're on dashboard, refresh it too
                        if (currentView === 'dashboard') {
                            loadDashboard();
                        }
                    }, 1500);
                }
            } catch (error) {
                showNotification('Σφάλμα κατά την επαναφορά: ' + error.message, 'danger');
            }
        };
        reader.readAsText(file);
    }
    
    // Αυτόματο backup σύστημα
    function createAutoBackup() {
        try {
            const backup = {
                children: safeGetFromStorage('pitsasChildren', []),
                transactions: safeGetFromStorage('pitsasTransactions', []),
                settings: safeGetFromStorage('pitsasSettings', {}),
                timestamp: new Date().toISOString(),
                autoBackup: true
            };
            
            const backupString = JSON.stringify(backup, null, 2);
            
            // Χρήση του Electron API για αποθήκευση αρχείου - ΣΙΩΠΗΛΑ
            if (window.electronAPI && window.electronAPI.saveAutoBackup) {
                window.electronAPI.saveAutoBackup(backupString)
                    .then(() => {
                        // Σιωπηλή επιτυχία - δεν χρειάζεται μήνυμα
                    })
                    .catch(error => {
                        // Σιωπηλό error
                    });
            } else {
                // Fallback για browser - αποθήκευση στο localStorage - ΣΙΩΠΗΛΑ
                localStorage.setItem('pitsasAutoBackup', backupString);
                localStorage.setItem('pitsasAutoBackupDate', new Date().toISOString());
            }
        } catch (error) {
            // Σιωπηλό error handling
        }
    }
    
    async function loadAutoBackup() {
        try {
            if (window.electronAPI && window.electronAPI.loadAutoBackup) {
                // Φόρτωση από αρχείο μέσω Electron - ΣΙΩΠΗΛΑ
                window.electronAPI.loadAutoBackup()
                    .then(async backupData => {
                        if (backupData) {
                            // Αποθήκευση σε μεταβλητή για μελλοντική χρήση
                            window.availableAutoBackup = backupData;
                            
                            // Ανάλυση και έλεγχος backup
                            const backup = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
                            const backupDate = new Date(backup.timestamp);
                            const now = new Date();
                            const diffHours = (now - backupDate) / (1000 * 60 * 60);
                            
                            // Check current data state
                            const currentChildren = safeGetFromStorage('pitsasChildren', []);
                            const currentTransactions = safeGetFromStorage('pitsasTransactions', []);
                            const currentSettings = safeGetFromStorage('pitsasSettings', {});
                            const hasCurrentData = currentChildren.length > 0 || currentTransactions.length > 0;
                            
                            // Only show confirmation if backup is recent AND we have conflicting data
                            if (diffHours < 24 && hasCurrentData) {
                                const currentLastBackup = currentSettings.lastBackup ? new Date(currentSettings.lastBackup) : new Date(0);
                                
                                // Only ask if backup is actually newer than current data
                                if (backupDate > currentLastBackup) {
                                    const backupTime = backupDate.toLocaleString('el-GR');
                                    const currentTime = (currentSettings.lastBackup && currentLastBackup.getTime() > 0) ? 
                                                       currentLastBackup.toLocaleString('el-GR') : 
                                                       'Άγνωστη';
                                    
                                    const message = `🔄 Βρέθηκε νεότερο αυτόματο backup!\n\n` +
                                                   `📅 Backup: ${backupTime}\n` +
                                                   `📅 Τρέχοντα: ${currentTime}\n\n` +
                                                   `Θέλετε να επαναφέρετε τα νεότερα δεδομένα;`;
                                    
                                    if (await showConfirmModal('Νεότερο Backup Διαθέσιμο', message)) {
                                        // Επαναφορά δεδομένων
                                        if (backup.children) safeSetToStorage('pitsasChildren', backup.children);
                                        if (backup.transactions) safeSetToStorage('pitsasTransactions', backup.transactions);
                                        if (backup.settings) safeSetToStorage('pitsasSettings', backup.settings);
                                        
                                        showNotification('Τα δεδομένα επαναφέρθηκαν από το αυτόματο backup!', 'success');
                                        
                                        // Refresh views instead of reloading the page
                                        setTimeout(() => {
                                            // Refresh all views to show restored data
                                            refreshCurrentView();
                                            
                                            // If we're on dashboard, refresh it too
                                            if (currentView === 'dashboard') {
                                                loadDashboard();
                                            }
                                        }, 1500);
                                    }
                                }
                            } else if (!hasCurrentData && diffHours < 168) { // 1 week for empty data
                                // If no current data exists, auto-restore recent backup without confirmation
                                if (backup.children) safeSetToStorage('pitsasChildren', backup.children);
                                if (backup.transactions) safeSetToStorage('pitsasTransactions', backup.transactions);
                                if (backup.settings) safeSetToStorage('pitsasSettings', backup.settings);
                                
                                showNotification('Αυτόματη επαναφορά δεδομένων από backup', 'info');
                                
                                // Refresh views
                                setTimeout(() => {
                                    refreshCurrentView();
                                    
                                    if (currentView === 'dashboard') {
                                        loadDashboard();
                                    }
                                }, 1000);
                            }
                        }
                    })
                    .catch(error => {
                        // Σιωπηλό error - δεν χρειάζεται να ενημερώσουμε τον χρήστη
                    });
            } else {
                // Fallback για browser - ΣΙΩΠΗΛΑ
                const backupString = localStorage.getItem('pitsasAutoBackup');
                if (backupString) {
                    window.availableAutoBackup = backupString;
                }
            }
        } catch (error) {
            // Σιωπηλό error handling
        }
    }
    
    // Χειροκίνητη εμφάνιση backup για recovery
    async function showEmergencyBackupInfo() {
        const hasBackup = window.availableAutoBackup;
        let message = '🔍 Πληροφορίες Αυτόματου Backup:\n\n';
        
        if (hasBackup) {
            try {
                const backup = typeof hasBackup === 'string' ? JSON.parse(hasBackup) : hasBackup;
                const backupDate = new Date(backup.timestamp);
                const backupDateStr = backupDate.toLocaleString('el-GR');
                const childrenCount = backup.children ? backup.children.length : 0;
                const transactionsCount = backup.transactions ? backup.transactions.length : 0;
                
                // Check current data
                const currentChildren = safeGetFromStorage('pitsasChildren', []);
                const currentTransactions = safeGetFromStorage('pitsasTransactions', []);
                const currentSettings = safeGetFromStorage('pitsasSettings', {});
                const currentLastBackup = currentSettings.lastBackup ? new Date(currentSettings.lastBackup) : new Date(0);
                const hasCurrentData = currentChildren.length > 0 || currentTransactions.length > 0;
                
                message += `✅ Διαθέσιμο Backup:\n`;
                message += `📅 Ημερομηνία: ${backupDateStr}\n`;
                message += `👶 Παιδιά: ${childrenCount}\n`;
                message += `💳 Συναλλαγές: ${transactionsCount}\n\n`;
                
                // Add warning if backup is older than current data
                if (hasCurrentData && backupDate < currentLastBackup) {
                    const currentDateStr = currentLastBackup.toLocaleString('el-GR');
                    message += `⚠️ ΠΡΟΣΟΧΗ: Το backup είναι παλαιότερο!\n`;
                    message += `📅 Τρέχοντα δεδομένα: ${currentDateStr}\n\n`;
                    message += `Η επαναφορά θα αντικαταστήσει νεότερα δεδομένα.\n\n`;
                } else if (hasCurrentData && backupDate > currentLastBackup) {
                    message += `✨ Το backup είναι νεότερο από τα τρέχοντα δεδομένα.\n\n`;
                } else if (!hasCurrentData) {
                    message += `💡 Δεν υπάρχουν τρέχοντα δεδομένα.\n\n`;
                }
                
                message += `Θέλετε να επαναφέρετε αυτά τα δεδομένα;`;
                
                if (await showConfirmModal('Επαναφορά Backup', message)) {
                    // Process the backup directly
                    try {
                        const backup = typeof hasBackup === 'string' ? JSON.parse(hasBackup) : hasBackup;
                        if (backup.children) safeSetToStorage('pitsasChildren', backup.children);
                        if (backup.transactions) safeSetToStorage('pitsasTransactions', backup.transactions);
                        if (backup.settings) safeSetToStorage('pitsasSettings', backup.settings);
                        
                        showNotification('Τα δεδομένα επαναφέρθηκαν από το αυτόματο backup!', 'success');
                        
                        // Refresh views
                        setTimeout(() => {
                            refreshCurrentView();
                            
                            if (currentView === 'dashboard') {
                                loadDashboard();
                            }
                        }, 1500);
                    } catch (error) {
                        console.error('Error processing backup:', error);
                        showNotification('Σφάλμα κατά την επαναφορά backup', 'error');
                    }
                }
            } catch (error) {
                message += `❌ Σφάλμα ανάλυσης backup`;
                await showAlertModal('Σφάλμα', message);
            }
        } else {
            message += `❌ Δεν βρέθηκε διαθέσιμο αυτόματο backup.\n\n`;
            
            if (window.electronAPI) {
                const userDataPath = require('electron').app?.getPath('userData') || '%APPDATA%/pitsas-camp-bank';
                message += `📁 Τοποθεσία αρχείου:\n${userDataPath}/pitsas_auto_backup.json\n\n`;
            } else {
                message += `💾 Backup αποθηκεύεται στο localStorage του browser.\n\n`;
            }
            
            message += `💡 Αν νομίζετε ότι έχετε χάσει δεδομένα:\n`;
            message += `1. Ελέγξτε την παραπάνω τοποθεσία για το αρχείο backup\n`;
            message += `2. Χρησιμοποιήστε το κανονικό backup/restore από το μενού\n`;
            message += `3. Επικοινωνήστε με υποστήριξη`;
            
            await showAlertModal('Πληροφορίες Backup', message);
        }
    }
    
    // Αρχικοποίηση αυτόματου backup συστήματος
    async function initializeAutoBackup() {
        // Ensure lastBackup timestamp exists
        ensureLastBackupTimestamp();
        
        // Φόρτωση αυτόματου backup κατά την εκκίνηση - ΣΙΩΠΗΛΑ
        await loadAutoBackup();
        
        // Initialize Excel import events once at startup
        initializeExcelImportEvents();
        
        // Αυτόματο backup κάθε 30 λεπτά - ΣΙΩΠΗΛΑ
        setInterval(createAutoBackup, 30 * 60 * 1000);
        
        // Αυτόματο backup όταν κλείνει η εφαρμογή - ΣΙΩΠΗΛΑ
        window.addEventListener('beforeunload', function(e) {
            createAutoBackup();
        });
        
        // Ακρόαση σήματος κλεισίματος από το Electron - ΣΙΩΠΗΛΑ
        if (window.electronAPI && window.electronAPI.onAppClosing) {
            window.electronAPI.onAppClosing(() => {
                createAutoBackup();
            });
        }
        
        // Αυτόματο backup όταν κρύβεται η εφαρμογή - ΣΙΩΠΗΛΑ
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                createAutoBackup();
            }
        });
        
        // Αυτόματο backup όταν χάνει το focus η εφαρμογή - ΣΙΩΠΗΛΑ
        window.addEventListener('blur', function() {
            createAutoBackup();
        });
        
        // Καθολική συνάρτηση για emergency backup info
        window.showEmergencyBackup = showEmergencyBackupInfo;
    }

    function toggleDarkMode() {
        const settings = safeGetFromStorage('pitsasSettings', {});
        settings.darkMode = !settings.darkMode;
        safeSetToStorage('pitsasSettings', settings);
        
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="bi bi-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggle.innerHTML = '<i class="bi bi-moon"></i>';
        }
    }
    
    // Sound notification system
    const soundNotifications = {
        success: () => playNotificationSound('success'),
        warning: () => playNotificationSound('warning'),
        error: () => playNotificationSound('error'),
        info: () => playNotificationSound('info')
    };
    
    function playNotificationSound(type) {
        const settings = safeGetFromStorage('pitsasSettings', { soundNotifications: true });
        if (!settings.soundNotifications) return;
        
        // Create audio context for better browser support
        if (!window.audioContext) {
            try {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Audio not supported');
                return;
            }
        }
        
        const context = window.audioContext;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        // Different sounds for different notification types
        const soundMap = {
            success: { frequency: 800, duration: 200, pattern: [1, 0.5, 1] },
            warning: { frequency: 600, duration: 300, pattern: [1, 0.3, 0.8] },
            error: { frequency: 400, duration: 400, pattern: [1, 0.2, 0.6, 0.2, 0.8] },
            danger: { frequency: 400, duration: 400, pattern: [1, 0.2, 0.6, 0.2, 0.8] },
            info: { frequency: 700, duration: 150, pattern: [1] },
            primary: { frequency: 900, duration: 300, pattern: [1, 0.7, 1.2, 0.8, 1.5] }
        };
        
        const sound = soundMap[type] || soundMap.info;
        
        oscillator.frequency.setValueAtTime(sound.frequency, context.currentTime);
        oscillator.type = 'sine';
        
        // Create sound pattern
        let time = context.currentTime;
        sound.pattern.forEach((volume, index) => {
            gainNode.gain.setValueAtTime(volume * 0.1, time);
            time += sound.duration / 1000 / sound.pattern.length;
            gainNode.gain.setValueAtTime(0, time);
            time += 0.05; // Short pause between tones
        });
        
        oscillator.start(context.currentTime);
        oscillator.stop(time);
    }
    
    function showNotification(message, type = 'info') {
        // Play sound notification
        playNotificationSound(type);
        
        const notificationContainer = document.getElementById('notification-container');
        
        const notification = document.createElement('div');
        notification.className = `toast align-items-center text-white bg-${type} border-0 notification-slide-in`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        notification.setAttribute('aria-atomic', 'true');
        
        const iconMap = {
            success: 'bi-check-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            error: 'bi-x-circle-fill',
            info: 'bi-info-circle-fill',
            danger: 'bi-x-circle-fill',
            primary: 'bi-person-check-fill'
        };
        
        const icon = iconMap[type] || iconMap.info;
        
        notification.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${icon} me-2 notification-icon-bounce"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        
        const toast = new bootstrap.Toast(notification, {
            autohide: true,
            delay: 5000
        });
        
        toast.show();
        
        // Remove the notification after it's hidden
        notification.addEventListener('hidden.bs.toast', function() {
            notification.remove();
        });
    }
    
        // Λειτουργία για εμφάνιση παραθύρου επιβεβαίωσης παράκαμψης ορίου
    function showLimitOverrideConfirmation(child, amount, remainingDaily) {
        // Κλείσιμο του τρέχοντος modal
        transactionModal.hide();
        
        // Εμφάνιση των λεπτομερειών υπέρβασης στο modal
        const limitOverrideDetails = document.getElementById('limit-override-details');
        limitOverrideDetails.innerHTML = `
            <div class="override-details mb-3">
                <p>
                    <strong>Παιδί:</strong> ${child.firstName} ${child.lastName} (${child.campId || 'N/A'})<br>
                    <strong>Ημερήσιο όριο:</strong> ${(child.dailyLimit || 0).toFixed(2)}€<br>
                    <strong>Ήδη ανέλαβε σήμερα:</strong> ${(child.todaySpent || 0).toFixed(2)}€<br>
                    <strong>Διαθέσιμο υπόλοιπο ημέρας:</strong> ${remainingDaily.toFixed(2)}€<br>
                    <strong>Ζητούμενο ποσό:</strong> ${amount.toFixed(2)}€<br>
                    <strong>Υπέρβαση κατά:</strong> ${(amount - remainingDaily).toFixed(2)}€
                </p>
            </div>
        `;
        
        // Επαναφορά του checkbox και της αιτιολογίας
        document.getElementById('confirm-override').checked = false;
        document.getElementById('override-reason').value = '';
        confirmOverrideBtn.disabled = true;
        
        // Εμφάνιση του modal
        limitOverrideModal.show();
    }
    
    // Λειτουργία για υπολογισμό διαθέσιμου ημερήσιου ορίου
    function getRemainingDailyLimit(child) {
        // Εξασφάλιση ότι τα απαραίτητα πεδία υπάρχουν (για legacy data)
        if (typeof child.dailyLimit === 'undefined') {
            child.dailyLimit = 5; // Προεπιλεγμένο όριο
        }
        if (typeof child.todaySpent === 'undefined') {
            child.todaySpent = 0;
        }
        if (typeof child.allowOverride === 'undefined') {
            child.allowOverride = true;
        }
        
        // Επαναφορά ημερήσιου ορίου αν είναι νέα ημέρα
        const today = new Date().toISOString().split('T')[0];
        if (child.lastSpendingReset !== today) {
            child.todaySpent = 0;
            child.lastSpendingReset = today;
            
            // Αποθηκεύουμε τις αλλαγές
            const children = safeGetFromStorage('pitsasChildren', []);
            const childIndex = children.findIndex(c => c.id === child.id);
            if (childIndex !== -1) {
                children[childIndex] = child;
                safeSetToStorage('pitsasChildren', children);
            }
        }
        
        if (child.dailyLimit <= 0) {
            return Infinity; // Απεριόριστο
        }
        
        return Math.max(0, child.dailyLimit - (child.todaySpent || 0));
    }
    
    // Λειτουργία για επαναφορά ημερήσιων ορίων
    function resetDailySpending() {
        const today = new Date().toISOString().split('T')[0];
        const children = safeGetFromStorage('pitsasChildren', []);
        
        let updated = false;
        children.forEach(child => {
            if (child.lastSpendingReset !== today) {
                child.todaySpent = 0;
                child.lastSpendingReset = today;
                updated = true;
            }
        });
        
        if (updated) {
            safeSetToStorage('pitsasChildren', children);
            console.log('Daily spending limits have been reset for the new day.');
        }
    }
    
    // Λειτουργία για αυτόματη επαναφορά ορίων στις 00:00
    function setupDailyLimitReset() {
        function scheduleReset() {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0); // 00:00:00
            
            const timeUntilMidnight = tomorrow - now;
            
            // Προγραμματισμός επαναφοράς
            setTimeout(() => {
                resetDailySpending();
                scheduleReset(); // Προγραμματισμός για την επόμενη μέρα
            }, timeUntilMidnight);
        }
        
        // Εκκίνηση του προγραμματισμού
        scheduleReset();
    }
    
    // Λειτουργία μετανάστευσης δεδομένων
    function migrateChildrenData() {
        const children = safeGetFromStorage('pitsasChildren', []);
        let needsUpdate = false;
        
        children.forEach(child => {
            if (typeof child.dailyLimit === 'undefined') {
                child.dailyLimit = 5; // Προεπιλεγμένο όριο 5€
                needsUpdate = true;
            }
            if (typeof child.todaySpent === 'undefined') {
                child.todaySpent = 0;
                needsUpdate = true;
            }
            if (typeof child.allowOverride === 'undefined') {
                child.allowOverride = true;
                needsUpdate = true;
            }
            if (typeof child.lastSpendingReset === 'undefined') {
                child.lastSpendingReset = new Date().toISOString().split('T')[0];
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            safeSetToStorage('pitsasChildren', children);
        }
    }
    
    // Check if user is logged in (page refresh)
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = safeParseJSON(currentUser, null);
        if (user && user.name) {
            staffNameElement.textContent = user.name;
            loginContainer.classList.add('d-none');
            appContainer.classList.remove('d-none');
            loadDashboard();
        }
    }
    
    // Enhanced Navigation Functions
    function updateNavbarStats(childrenCount, totalBalance, todayTransactions) {
        // Update navbar badges
        const navChildrenCount = document.getElementById('nav-children-count');
        const navTransactionsToday = document.getElementById('nav-transactions-today');
        const navTotalBalance = document.getElementById('nav-total-balance');
        
        if (navChildrenCount) navChildrenCount.textContent = childrenCount;
        if (navTransactionsToday) navTransactionsToday.textContent = todayTransactions;
        if (navTotalBalance) navTotalBalance.textContent = totalBalance.toFixed(2) + '€';
    }
    
    function updateBreadcrumbs(section) {
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (!breadcrumbs) return;
        
        const breadcrumbData = {
            'dashboard': { icon: 'bi-house-door', text: 'Αρχική' },
            'children': { icon: 'bi-people', text: 'Παιδιά' },
            'transactions': { icon: 'bi-credit-card', text: 'Συναλλαγές' },
            'statistics': { icon: 'bi-bar-chart', text: 'Στατιστικά' }
        };
        
        const current = breadcrumbData[section];
        if (!current) return;
        
        breadcrumbs.innerHTML = `
            <li class="breadcrumb-item">
                <a href="#" id="home-breadcrumb" class="text-decoration-none">
                    <i class="bi bi-house-door me-1"></i>Αρχική
                </a>
            </li>
            ${section === 'dashboard' ? '' : `
                <li class="breadcrumb-item active">
                    <i class="${current.icon} me-1"></i>${current.text}
                </li>
            `}
        `;
        
        // Add click handler for home breadcrumb
        const homeBreadcrumb = document.getElementById('home-breadcrumb');
        if (homeBreadcrumb) {
            homeBreadcrumb.addEventListener('click', function(e) {
                e.preventDefault();
                showView(dashboardView);
                setActiveLink(dashboardLink);
                updateBreadcrumbs('dashboard');
            });
        }
    }
    
    // Enhanced navigation event listeners
    const homeLink = document.getElementById('home-brand');
    const navAddChild = document.getElementById('nav-add-child');
    const navBackup = document.getElementById('nav-backup');
