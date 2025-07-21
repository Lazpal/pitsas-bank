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
    const navQuickSearch = document.getElementById('nav-quick-search');
    const navBulkDeposit = document.getElementById('nav-bulk-deposit');
    const navDailyReport = document.getElementById('nav-daily-report');
    const navLimitsReport = document.getElementById('nav-limits-report');
    const navExportStats = document.getElementById('nav-export-stats');
    const navResetLimits = document.getElementById('nav-reset-limits');
    const navSettings = document.getElementById('nav-settings');
    const navDocumentation = document.getElementById('nav-documentation');
    const navBeginnerGuide = document.getElementById('nav-beginner-guide');
    const navShortcuts = document.getElementById('nav-shortcuts');
    const navExcelImport = document.getElementById('nav-excel-import');
    
    if (homeLink) {
        homeLink.addEventListener('click', function(e) {
            e.preventDefault();
            showView(dashboardView);
            setActiveLink(dashboardLink);
            updateBreadcrumbs('dashboard');
        });
    }
    
    if (navAddChild) {
        navAddChild.addEventListener('click', function(e) {
            e.preventDefault();
            addChildModal.show();
        });
    }
    
    if (navBackup) {
        navBackup.addEventListener('click', function(e) {
            e.preventDefault();
            backupModal.show();
        });
    }
    
    if (navQuickSearch) {
        navQuickSearch.addEventListener('click', function(e) {
            e.preventDefault();
            quickSearchModal.show();
        });
    }
    
    if (navBulkDeposit) {
        navBulkDeposit.addEventListener('click', function(e) {
            e.preventDefault();
            prepareBulkDeposit();
            bulkDepositModal.show();
        });
    }
    
    if (navDailyReport) {
        navDailyReport.addEventListener('click', function(e) {
            e.preventDefault();
            setupDailyReport();
            dailyReportModal.show();
        });
    }
    
    if (navLimitsReport) {
        navLimitsReport.addEventListener('click', function(e) {
            e.preventDefault();
            generateLimitsReport();
        });
    }
    
    if (navExportStats) {
        navExportStats.addEventListener('click', function(e) {
            e.preventDefault();
            exportFullStatistics();
        });
    }
    
    if (navResetLimits) {
        navResetLimits.addEventListener('click', function(e) {
            e.preventDefault();
            resetAllDailyLimits().catch(error => {
                console.error('Error resetting daily limits:', error);
                showNotification('Σφάλμα κατά την επαναφορά ορίων', 'error');
            });
        });
    }
    
    if (navSettings) {
        navSettings.addEventListener('click', function(e) {
            e.preventDefault();
            loadSettings();
            settingsModal.show();
        });
    }
    
    // Documentation Event Listeners
    if (navDocumentation) {
        navDocumentation.addEventListener('click', function(e) {
            e.preventDefault();
            showDocumentationModal();
        });
    }
    
    if (navBeginnerGuide) {
        navBeginnerGuide.addEventListener('click', function(e) {
            e.preventDefault();
            openDocumentationWindow('BEGINNER-GUIDE.md');
        });
    }
    
    if (navShortcuts) {
        navShortcuts.addEventListener('click', function(e) {
            e.preventDefault();
            keyboardShortcutsModal.show();
        });
    }
    
    // Excel Import Event Listener
    if (navExcelImport) {
        navExcelImport.addEventListener('click', function(e) {
            e.preventDefault();
            showExcelImportModal();
        });
    }
    
    // New Tools Functions
    
    // Quick Search functionality with debouncing for better performance
    let searchTimeout;
    document.getElementById('quick-search-input').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const resultsContainer = document.getElementById('quick-search-results');
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Add loading animation
        if (searchTerm.length >= 2) {
            resultsContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border spinner-border-sm text-primary" role="status"></div> Αναζήτηση...</div>';
        }
        
        // Debounce search to avoid excessive calls
        searchTimeout = setTimeout(() => {
            performQuickSearch(searchTerm, resultsContainer);
        }, 300);
    });
    
    // Separate function for performing search with animations
    function performQuickSearch(searchTerm, resultsContainer) {
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '<div class="text-muted text-center p-3 fade-in">Πληκτρολογήστε τουλάχιστον 2 χαρακτήρες</div>';
            return;
        }
        
        const children = safeGetFromStorage('pitsasChildren', []);
        const filteredChildren = children.filter(child => {
            const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
            const campId = (child.campId || '').toLowerCase();
            return fullName.includes(searchTerm) || campId.includes(searchTerm);
        });
        
        if (filteredChildren.length === 0) {
            resultsContainer.innerHTML = '<div class="text-muted text-center p-3 fade-in">Δεν βρέθηκαν αποτελέσματα</div>';
            return;
        }
        
        // Add animation classes to results
        resultsContainer.innerHTML = filteredChildren.map((child, index) => `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center search-result-item" style="animation-delay: ${index * 0.05}s">
                <div>
                    <h6 class="mb-1">${child.firstName} ${child.lastName}</h6>
                    <small class="text-muted">ID: ${child.campId || 'N/A'} | Ομάδα: ${child.group} | Υπόλοιπο: ${child.balance.toFixed(2)}€</small>
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success btn-animated" onclick="quickDeposit('${child.id}')">
                        <i class="bi bi-cash-coin"></i>
                    </button>
                    <button class="btn btn-outline-warning btn-animated" onclick="quickWithdraw('${child.id}')">
                        <i class="bi bi-cash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Quick transaction functions
    window.quickDeposit = function(childId) {
        quickSearchModal.hide();
        setTimeout(() => {
            prepareTransactionModal('deposit', childId);
        }, 300);
    };
    
    window.quickWithdraw = function(childId) {
        quickSearchModal.hide();
        setTimeout(() => {
            prepareTransactionModal('withdraw', childId);
        }, 300);
    };
    
    // Bulk Deposit functionality
    function prepareBulkDeposit() {
        const children = safeGetFromStorage('pitsasChildren', []);
        updateBulkChildrenList(children);
        
        // Set today's date as default amount date
        document.getElementById('bulk-amount').value = '';
        document.getElementById('bulk-notes').value = '';
        document.getElementById('bulk-group-filter').value = '';
        
        // Add group filter listener
        document.getElementById('bulk-group-filter').addEventListener('change', function() {
            const selectedGroup = this.value;
            const filteredChildren = selectedGroup ? 
                children.filter(child => child.group === selectedGroup) : children;
            updateBulkChildrenList(filteredChildren);
        });
    }
    
    function updateBulkChildrenList(children) {
        const container = document.getElementById('bulk-children-list');
        const countBadge = document.getElementById('bulk-selected-count');
        
        container.innerHTML = children.map(child => `
            <div class="form-check mb-2">
                <input class="form-check-input bulk-child-checkbox" type="checkbox" value="${child.id}" id="bulk-${child.id}">
                <label class="form-check-label w-100" for="bulk-${child.id}">
                    <div class="d-flex justify-content-between">
                        <span><strong>${child.firstName} ${child.lastName}</strong></span>
                        <small class="text-muted">${child.group} | ${child.balance.toFixed(2)}€</small>
                    </div>
                </label>
            </div>
        `).join('');
        
        // Update count and enable/disable button
        const checkboxes = container.querySelectorAll('.bulk-child-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const selectedCount = container.querySelectorAll('.bulk-child-checkbox:checked').length;
                countBadge.textContent = selectedCount;
                document.getElementById('execute-bulk-deposit').disabled = selectedCount === 0;
            });
        });
        
        countBadge.textContent = '0';
        document.getElementById('execute-bulk-deposit').disabled = true;
    }
    
    // Execute bulk deposit
    document.getElementById('execute-bulk-deposit').addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('bulk-amount').value);
        const notes = document.getElementById('bulk-notes').value;
        const selectedCheckboxes = document.querySelectorAll('.bulk-child-checkbox:checked');
        
        if (!amount || amount <= 0) {
            showNotification('Παρακαλώ εισάγετε έγκυρο ποσό!', 'warning');
            return;
        }
        
        const selectedChildIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        const children = safeGetFromStorage('pitsasChildren', []);
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        const currentUser = safeParseJSON(sessionStorage.getItem('currentUser'), {});
        
        // Process bulk deposits
        let successCount = 0;
        selectedChildIds.forEach(childId => {
            const childIndex = children.findIndex(c => c.id === childId);
            if (childIndex !== -1) {
                const child = children[childIndex];
                const oldBalance = child.balance;
                child.balance += amount;
                
                // Create transaction
                const transaction = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    childId,
                    type: 'deposit',
                    amount,
                    date: new Date().toISOString(),
                    staff: currentUser.name || 'Άγνωστος',
                    notes: notes + ' [ΟΜΑΔΙΚΗ ΚΑΤΑΘΕΣΗ]',
                    oldBalance,
                    newBalance: child.balance,
                    limitOverride: false
                };
                
                transactions.push(transaction);
                successCount++;
            }
        });
        
        // Save changes
        safeSetToStorage('pitsasChildren', children);
        safeSetToStorage('pitsasTransactions', transactions);
        
        bulkDepositModal.hide();
        showNotification(`Εκτελέστηκαν ${successCount} καταθέσεις επιτυχώς!`, 'success');
        
        // Refresh current view
        if (!dashboardView.classList.contains('d-none')) {
            loadDashboard();
        } else if (!childrenView.classList.contains('d-none')) {
            loadChildren();
        }
    });
    
    // Daily Report functionality
    function setupDailyReport() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('report-date').value = today;
    }
    
    document.getElementById('generate-daily-report').addEventListener('click', function() {
        const reportDate = document.getElementById('report-date').value;
        if (!reportDate) {
            showNotification('Παρακαλώ επιλέξτε ημερομηνία!', 'warning');
            return;
        }
        
        const children = safeGetFromStorage('pitsasChildren', []);
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        
        // Filter transactions for the selected date
        const dayTransactions = transactions.filter(t => 
            t.date.startsWith(reportDate)
        );
        
        const deposits = dayTransactions.filter(t => t.type === 'deposit');
        const withdrawals = dayTransactions.filter(t => t.type === 'withdraw');
        
        const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
        
        // Generate report HTML
        const reportHTML = `
            <div class="daily-report">
                <div class="text-center mb-4">
                    <h3>Ημερήσια Αναφορά</h3>
                    <h5>${new Date(reportDate).toLocaleDateString('el-GR')}</h5>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-white bg-info">
                            <div class="card-body text-center">
                                <h6>Συναλλαγές</h6>
                                <h3>${dayTransactions.length}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-success">
                            <div class="card-body text-center">
                                <h6>Καταθέσεις</h6>
                                <h3>${totalDeposits.toFixed(2)}€</h3>
                                <small>${deposits.length} συναλλαγές</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-warning">
                            <div class="card-body text-center">
                                <h6>Αναλήψεις</h6>
                                <h3>${totalWithdrawals.toFixed(2)}€</h3>
                                <small>${withdrawals.length} συναλλαγές</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-primary">
                            <div class="card-body text-center">
                                <h6>Καθαρή Ροή</h6>
                                <h3>${(totalDeposits - totalWithdrawals).toFixed(2)}€</h3>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12">
                        <h5>Λεπτομερείς Συναλλαγές</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Ώρα</th>
                                        <th>Παιδί</th>
                                        <th>Τύπος</th>
                                        <th>Ποσό</th>
                                        <th>Υπάλληλος</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${dayTransactions.length === 0 ? 
                                        '<tr><td colspan="5" class="text-center">Δεν υπάρχουν συναλλαγές για αυτή την ημερομηνία</td></tr>' :
                                        dayTransactions.map(t => {
                                            const child = children.find(c => c.id === t.childId);
                                            const childName = child ? `${child.firstName} ${child.lastName}` : 'Άγνωστο';
                                            const time = new Date(t.date).toLocaleTimeString('el-GR');
                                            const typeClass = t.type === 'deposit' ? 'text-success' : 'text-warning';
                                            const typeText = t.type === 'deposit' ? 'Κατάθεση' : 'Ανάληψη';
                                            
                                            return `
                                                <tr>
                                                    <td>${time}</td>
                                                    <td>${childName}</td>
                                                    <td class="${typeClass}">${typeText}</td>
                                                    <td class="${typeClass}">${t.amount.toFixed(2)}€</td>
                                                    <td>${t.staff}</td>
                                                </tr>
                                            `;
                                        }).join('')
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('daily-report-content').innerHTML = reportHTML;
        document.getElementById('print-daily-report').disabled = false;
    });
    
    document.getElementById('print-daily-report').addEventListener('click', function() {
        printElement('daily-report-content');
    });
    
    // Settings functionality
    function loadSettings() {
        const settings = safeGetFromStorage('pitsasSettings', {
            itemsPerPage: 10,
            defaultDailyLimit: 5,
            autoBackup: false,
            soundNotifications: true,
            darkMode: false,
            keyboardShortcuts: true,
            smartAlerts: true
        });
        
        document.getElementById('settings-items-per-page').value = settings.itemsPerPage || 10;
        document.getElementById('settings-default-limit').value = settings.defaultDailyLimit || 5;
        document.getElementById('settings-auto-backup').checked = settings.autoBackup || false;
        document.getElementById('settings-sound-notifications').checked = settings.soundNotifications !== false;
        document.getElementById('settings-dark-mode').checked = settings.darkMode || false;
        document.getElementById('settings-keyboard-shortcuts').checked = settings.keyboardShortcuts !== false;
        document.getElementById('settings-smart-alerts').checked = settings.smartAlerts !== false;
    }
    
    document.getElementById('save-settings').addEventListener('click', function() {
        const settings = {
            itemsPerPage: parseInt(document.getElementById('settings-items-per-page').value),
            defaultDailyLimit: parseFloat(document.getElementById('settings-default-limit').value),
            autoBackup: document.getElementById('settings-auto-backup').checked,
            soundNotifications: document.getElementById('settings-sound-notifications').checked,
            darkMode: document.getElementById('settings-dark-mode').checked,
            keyboardShortcuts: document.getElementById('settings-keyboard-shortcuts').checked,
            smartAlerts: document.getElementById('settings-smart-alerts').checked
        };
        
        safeSetToStorage('pitsasSettings', settings);
        settingsModal.hide();
        showNotification('Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!', 'success');
        
        // Apply dark mode if changed
        if (settings.darkMode !== document.body.classList.contains('dark-mode')) {
            toggleDarkMode();
        }
    });
    
    // Test sound button functionality
    document.getElementById('test-sound-btn').addEventListener('click', function() {
        const isEnabled = document.getElementById('settings-sound-notifications').checked;
        if (!isEnabled) {
            // Temporarily enable sound for test
            const tempSettings = { soundNotifications: true };
            const originalStorage = safeGetFromStorage('pitsasSettings', {});
            safeSetToStorage('pitsasSettings', tempSettings);
            playNotificationSound('success');
            // Restore original settings
            setTimeout(() => {
                safeSetToStorage('pitsasSettings', originalStorage);
            }, 1000);
        } else {
            playNotificationSound('success');
        }
        showNotification('Δοκιμή ηχητικής ειδοποίησης!', 'info');
    });
    
    // Utility functions for new tools
    function generateLimitsReport() {
        const children = safeGetFromStorage('pitsasChildren', []);
        const childrenWithLimits = children.filter(c => c.dailyLimit > 0);
        
        if (childrenWithLimits.length === 0) {
            showNotification('Δεν υπάρχουν παιδιά με ημερήσια όρια!', 'info');
            return;
        }
        
        showView(statisticsView);
        setActiveLink(statisticsLink);
        loadStatistics();
        updateBreadcrumbs('statistics');
        
        // Scroll to limits section
        setTimeout(() => {
            const limitsSection = document.getElementById('limit-stats-container');
            if (limitsSection) {
                limitsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
        
        showNotification('Αναφορά ημερήσιων ορίων φορτώθηκε στη σελίδα Στατιστικών', 'info');
    }
    
    function exportFullStatistics() {
        const children = safeGetFromStorage('pitsasChildren', []);
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        
        // Prepare comprehensive statistics
        const stats = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalChildren: children.length,
                totalBalance: children.reduce((sum, child) => sum + child.balance, 0),
                totalTransactions: transactions.length,
                totalDeposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
                totalWithdrawals: transactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + t.amount, 0)
            },
            children: children,
            transactions: transactions
        };
        
        // Export as JSON
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pitsas_camp_full_statistics_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        showNotification('Τα πλήρη στατιστικά εξάχθηκαν επιτυχώς!', 'success');
    }
    
    async function resetAllDailyLimits() {
        if (!await showConfirmModal('Επαναφορά Ημερήσιων Ορίων', 'Είστε σίγουροι ότι θέλετε να επαναφέρετε όλα τα ημερήσια όρια; Αυτή η ενέργεια θα μηδενίσει τα σημερινά έξοδα όλων των παιδιών.')) {
            return;
        }
        
        const children = safeGetFromStorage('pitsasChildren', []);
        const today = new Date().toISOString().split('T')[0];
        
        children.forEach(child => {
            child.todaySpent = 0;
            child.lastSpendingReset = today;
        });
        
        safeSetToStorage('pitsasChildren', children);
        showNotification('Όλα τα ημερήσια όρια επαναφέρθηκαν επιτυχώς!', 'success');
        
        // Refresh current view
        if (!dashboardView.classList.contains('d-none')) {
            loadDashboard();
        } else if (!childrenView.classList.contains('d-none')) {
            loadChildren();
        }
    }
    
    // Initialize animations and performance optimizations
    function initializeAnimations() {
        // Add fade-in to main containers
        const containers = document.querySelectorAll('.container, .card, .modal-content');
        containers.forEach((container, index) => {
            container.style.animationDelay = `${index * 0.1}s`;
            container.classList.add('fade-in');
        });
        
        // Add hover effects to dashboard cards
        const dashboardCards = document.querySelectorAll('.dashboard-card');
        dashboardCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
        
        // Optimize animations for performance
        if (window.DeviceMotionEvent && 'ontouchstart' in window) {
            // Reduce animations on mobile devices
            document.body.classList.add('mobile-optimized');
        }
    }
    
    // Enhanced modal keyboard navigation
    function initializeModalKeyboardSupport() {
        // Add Enter key support for all modals
        document.addEventListener('keydown', function(e) {
            // Don't trigger if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }
            
            const openModal = document.querySelector('.modal.show');
            if (!openModal) return;
            
            if (e.key === 'Enter') {
                e.preventDefault();
                
                // Handle specific modals
                const modalId = openModal.id;
                
                switch(modalId) {
                    case 'receiptModal':
                    case 'idCardModal':
                        // Close these modals with Enter
                        const modalInstance = bootstrap.Modal.getInstance(openModal);
                        if (modalInstance) modalInstance.hide();
                        break;
                        
                    case 'transactionModal':
                        // Submit transaction with Enter
                        const submitBtn = document.getElementById('save-transaction-btn');
                        if (submitBtn && !submitBtn.disabled) {
                            submitBtn.click();
                        }
                        break;
                        
                    case 'addChildModal':
                        // Submit child form with Enter
                        const saveChildBtn = document.getElementById('save-child-btn');
                        if (saveChildBtn && !saveChildBtn.disabled) {
                            saveChildBtn.click();
                        }
                        break;
                        
                    default:
                        // For other modals, find the primary button and click it
                        const primaryBtn = openModal.querySelector('.btn-primary:not(:disabled)');
                        if (primaryBtn) {
                            primaryBtn.click();
                        }
                        break;
                }
            }
        });
        
        // Fix focus issues με modals
        document.addEventListener('shown.bs.modal', function(e) {
            // Όταν ανοίγει modal, focus στο πρώτο input
            const modal = e.target;
            const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select');
            if (firstInput) {
                setTimeout(() => {
                    firstInput.focus();
                }, 100);
            }
        });
        
        document.addEventListener('hidden.bs.modal', function(e) {
            // Όταν κλείνει modal, επαναφορά focus στο body
            setTimeout(() => {
                document.body.focus();
                // Εάν είμαστε σε Electron, focus στο webContents
                if (window.electronAPI) {
                    window.focus();
                }
            }, 100);
        });
    }
    
    // Initialize breadcrumbs
    updateBreadcrumbs('dashboard');
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Initialize keyboard shortcuts
    setTimeout(() => {
        initializeKeyboardShortcuts();
        console.log('Keyboard shortcuts initialized');
    }, 100);
    
    // Initialize smart alerts
    initializeSmartAlerts();
    
    // Initialize animations
    initializeAnimations();
    
    // Initialize modal keyboard support
    initializeModalKeyboardSupport();
    
    // Function to initialize dark mode on app load
    function initializeDarkMode() {
        const settings = safeGetFromStorage('pitsasSettings', {});
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            toggleDarkMode();
        }
    }
    
    // Keyboard Shortcuts System
    function initializeKeyboardShortcuts() {
        const settings = safeGetFromStorage('pitsasSettings', { keyboardShortcuts: true });
        if (!settings.keyboardShortcuts) return;
        
        // Verify that all required modals exist before setting up shortcuts
        const requiredElements = [
            'addChildModal', 'quickSearchModal', 'backupModal', 'settingsModal',
            'advancedSearchModal', 'keyboardShortcutsModal'
        ];
        
        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId)) {
                console.warn(`Element ${elementId} not found, keyboard shortcuts may not work properly`);
            }
        }
        
        document.addEventListener('keydown', function(e) {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
                return;
            }
            
            // Ctrl + combinations
            if (e.ctrlKey && !e.shiftKey && !e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        e.stopPropagation();
                        if (addChildModal) addChildModal.show();
                        break;
                    case 'f':
                        e.preventDefault();
                        e.stopPropagation();
                        if (quickSearchModal) quickSearchModal.show();
                        setTimeout(() => {
                            const searchInput = document.getElementById('quick-search-input');
                            if (searchInput) searchInput.focus();
                        }, 100);
                        break;
                    case 'd':
                        e.preventDefault();
                        e.stopPropagation();
                        prepareTransactionModal('deposit');
                        break;
                    case 'w':
                        e.preventDefault();
                        e.stopPropagation();
                        prepareTransactionModal('withdraw');
                        break;
                    case 'b':
                        e.preventDefault();
                        e.stopPropagation();
                        if (backupModal) backupModal.show();
                        break;
                    case ',':
                        e.preventDefault();
                        e.stopPropagation();
                        if (settingsModal) settingsModal.show();
                        break;
                }
            }
            
            // Ctrl + Shift combinations
            if (e.ctrlKey && e.shiftKey && !e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 'f':
                        e.preventDefault();
                        e.stopPropagation();
                        if (advancedSearchModal) advancedSearchModal.show();
                        setTimeout(() => {
                            const advSearchInput = document.getElementById('adv-search-text');
                            if (advSearchInput) advSearchInput.focus();
                        }, 100);
                        break;
                    case 'r':
                        // Ctrl+Shift+R για Emergency Backup Recovery
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof showEmergencyBackupInfo === 'function') {
                            showEmergencyBackupInfo().catch(error => {
                                console.error('Error showing emergency backup info:', error);
                            });
                        }
                        break;
                }
            }
            
            // Alt + number combinations for navigation
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        e.stopPropagation();
                        if (dashboardView && dashboardLink) {
                            showView(dashboardView);
                            setActiveLink(dashboardLink);
                            updateBreadcrumbs('dashboard');
                        }
                        break;
                    case '2':
                        e.preventDefault();
                        e.stopPropagation();
                        if (childrenView && childrenLink) {
                            showView(childrenView);
                            setActiveLink(childrenLink);
                            loadChildren();
                            updateBreadcrumbs('children');
                        }
                        break;
                    case '3':
                        e.preventDefault();
                        e.stopPropagation();
                        if (transactionsView && transactionsLink) {
                            showView(transactionsView);
                            setActiveLink(transactionsLink);
                            loadTransactions();
                            updateBreadcrumbs('transactions');
                        }
                        break;
                    case '4':
                        e.preventDefault();
                        e.stopPropagation();
                        if (statisticsView && statisticsLink) {
                            showView(statisticsView);
                            setActiveLink(statisticsLink);
                            loadStatistics();
                            updateBreadcrumbs('statistics');
                        }
                        break;
                }
            }
            
            // F1 for help
            if (e.key === 'F1') {
                e.preventDefault();
                e.stopPropagation();
                if (keyboardShortcutsModal) keyboardShortcutsModal.show();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                const openModals = document.querySelectorAll('.modal.show');
                if (openModals.length > 0) {
                    const modalInstance = bootstrap.Modal.getInstance(openModals[openModals.length - 1]);
                    if (modalInstance) modalInstance.hide();
                }
            }
        }, true); // Use capture mode to handle events before they bubble
    }
    
    // Smart Alerts System
    function initializeSmartAlerts() {
        const settings = safeGetFromStorage('pitsasSettings', { smartAlerts: true });
        if (!settings.smartAlerts) return;
        
        // Check for alerts every 30 seconds
        setInterval(checkSmartAlerts, 30000);
        
        // Run initial check after 5 seconds
        setTimeout(checkSmartAlerts, 5000);
    }
    
    function checkSmartAlerts() {
        const settings = safeGetFromStorage('pitsasSettings', { smartAlerts: true });
        if (!settings.smartAlerts) return;
        
        const children = safeGetFromStorage('pitsasChildren', []);
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        const today = new Date().toISOString().split('T')[0];
        
        // Check for low balances
        const lowBalanceChildren = children.filter(child => child.balance < 2 && child.balance > 0);
        if (lowBalanceChildren.length > 0) {
            showSmartAlert(
                'warning',
                'Χαμηλά Υπόλοιπα',
                `${lowBalanceChildren.length} παιδιά έχουν υπόλοιπο κάτω από 2€`,
                'low-balance'
            );
        }
        
        // Check for children who exceeded daily limits
        const exceededLimitChildren = children.filter(child => {
            if (!child.dailyLimit || child.dailyLimit === 0) return false;
            const todaySpent = child.todaySpent || 0;
            return todaySpent > child.dailyLimit;
        });
        
        if (exceededLimitChildren.length > 0) {
            showSmartAlert(
                'danger',
                'Υπέρβαση Ορίων',
                `${exceededLimitChildren.length} παιδιά έχουν υπερβεί το ημερήσιο όριό τους`,
                'exceeded-limits'
            );
        }
        
        // Check for inactive children (no transactions in last 3 days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const recentTransactions = transactions.filter(t => new Date(t.date) >= threeDaysAgo);
        const activeChildrenIds = new Set(recentTransactions.map(t => t.childId));
        const inactiveChildren = children.filter(child => !activeChildrenIds.has(child.id) && child.balance > 0);
        
        if (inactiveChildren.length > 5) {
            showSmartAlert(
                'info',
                'Αδρανή Παιδιά',
                `${inactiveChildren.length} παιδιά δεν έχουν κάνει συναλλαγές τις τελευταίες 3 ημέρες`,
                'inactive-children'
            );
        }
        
        // Check for high transaction day
        const todayTransactions = transactions.filter(t => t.date.startsWith(today));
        if (todayTransactions.length > 50) {
            showSmartAlert(
                'info',
                'Πολυάσχολη Ημέρα',
                `Υψηλή δραστηριότητα σήμερα: ${todayTransactions.length} συναλλαγές`,
                'busy-day'
            );
        }
    }
    
    let activeSmartAlerts = new Set();
    
    function showSmartAlert(type, title, message, alertId) {
        if (activeSmartAlerts.has(alertId)) return; // Don't show duplicate alerts
        
        activeSmartAlerts.add(alertId);
        
        const alertContainer = document.getElementById('smart-alerts-container');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show shadow-sm smart-alert smart-alert-slide-in`;
        alert.setAttribute('data-alert-id', alertId);
        
        alert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-lightbulb me-2 smart-alert-pulse"></i>
                <div>
                    <strong>${title}</strong><br>
                    <small>${message}</small>
                </div>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                bootstrap.Alert.getInstance(alert)?.close();
                activeSmartAlerts.delete(alertId);
            }
        }, 10000);
        
        // Remove from active alerts when dismissed
        alert.addEventListener('closed.bs.alert', () => {
            activeSmartAlerts.delete(alertId);
        });
        
        // Play sound if enabled
        playNotificationSound(type);
    }
    
    // Advanced Search System
    // (Modals are declared at the top of the file)
    
    // Advanced search event listeners
    document.getElementById('nav-advanced-search').addEventListener('click', function(e) {
        e.preventDefault();
        advancedSearchModal.show();
        setTimeout(() => document.getElementById('adv-search-text').focus(), 100);
    });
    
    document.getElementById('execute-advanced-search').addEventListener('click', executeAdvancedSearch);
    document.getElementById('clear-advanced-search').addEventListener('click', clearAdvancedSearch);
    document.getElementById('save-search-preset').addEventListener('click', saveSearchPreset);
    
    function executeAdvancedSearch() {
        const searchParams = {
            text: document.getElementById('adv-search-text').value.toLowerCase(),
            category: document.getElementById('adv-search-category').value,
            group: document.getElementById('adv-search-group').value,
            ageMin: parseInt(document.getElementById('adv-search-age-min').value) || null,
            ageMax: parseInt(document.getElementById('adv-search-age-max').value) || null,
            balanceMin: parseFloat(document.getElementById('adv-search-balance-min').value) || null,
            balanceMax: parseFloat(document.getElementById('adv-search-balance-max').value) || null,
            limitStatus: document.getElementById('adv-search-limit-status').value,
            dateFrom: document.getElementById('adv-search-date-from').value,
            dateTo: document.getElementById('adv-search-date-to').value
        };
        
        const children = safeGetFromStorage('pitsasChildren', []);
        const transactions = safeGetFromStorage('pitsasTransactions', []);
        
        let results = {
            children: [],
            transactions: [],
            groups: []
        };
        
        // Search children
        if (searchParams.category === 'all' || searchParams.category === 'children') {
            results.children = children.filter(child => {
                // Text search
                if (searchParams.text) {
                    const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
                    const campId = (child.campId || '').toLowerCase();
                    if (!fullName.includes(searchParams.text) && !campId.includes(searchParams.text)) {
                        return false;
                    }
                }
                
                // Group filter
                if (searchParams.group && child.group !== searchParams.group) {
                    return false;
                }
                
                // Age filter
                if (searchParams.ageMin && child.age < searchParams.ageMin) {
                    return false;
                }
                if (searchParams.ageMax && child.age > searchParams.ageMax) {
                    return false;
                }
                
                // Balance filter
                if (searchParams.balanceMin && child.balance < searchParams.balanceMin) {
                    return false;
                }
                if (searchParams.balanceMax && child.balance > searchParams.balanceMax) {
                    return false;
                }
                
                // Limit status filter
                if (searchParams.limitStatus) {
                    const todaySpent = child.todaySpent || 0;
                    const dailyLimit = child.dailyLimit || 0;
                    
                    switch (searchParams.limitStatus) {
                        case 'exceeded':
                            if (dailyLimit === 0 || todaySpent <= dailyLimit) return false;
                            break;
                        case 'near-limit':
                            if (dailyLimit === 0 || todaySpent < dailyLimit * 0.8 || todaySpent > dailyLimit) return false;
                            break;
                        case 'under-limit':
                            if (dailyLimit > 0 && todaySpent >= dailyLimit * 0.8) return false;
                            break;
                    }
                }
                
                return true;
            });
        }
        
        // Search transactions
        if (searchParams.category === 'all' || searchParams.category === 'transactions') {
            results.transactions = transactions.filter(transaction => {
                // Text search
                if (searchParams.text) {
                    const child = children.find(c => c.id === transaction.childId);
                    const childName = child ? `${child.firstName} ${child.lastName}`.toLowerCase() : '';
                    const staff = transaction.staff.toLowerCase();
                    const notes = (transaction.notes || '').toLowerCase();
                    
                    if (!childName.includes(searchParams.text) && 
                        !staff.includes(searchParams.text) && 
                        !notes.includes(searchParams.text)) {
                        return false;
                    }
                }
                
                // Date filter
                const transactionDate = transaction.date.split('T')[0];
                if (searchParams.dateFrom && transactionDate < searchParams.dateFrom) {
                    return false;
                }
                if (searchParams.dateTo && transactionDate > searchParams.dateTo) {
                    return false;
                }
                
                return true;
            });
        }
        
        displayAdvancedSearchResults(results, searchParams);
    }
    
    function displayAdvancedSearchResults(results, searchParams) {
        const resultsContainer = document.getElementById('advanced-search-results');
        
        let html = `<div class="search-results">`;
        
        // Summary
        const totalResults = results.children.length + results.transactions.length;
        html += `<div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Βρέθηκαν <strong>${totalResults}</strong> αποτελέσματα
            (${results.children.length} παιδιά, ${results.transactions.length} συναλλαγές)
        </div>`;
        
        // Children results
        if (results.children.length > 0) {
            html += `<div class="mb-4">
                <h6><i class="bi bi-people me-2"></i>Παιδιά (${results.children.length})</h6>
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th>Όνομα</th>
                                <th>Ομάδα</th>
                                <th>Ηλικία</th>
                                <th>Υπόλοιπο</th>
                                <th>Ενέργειες</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            results.children.forEach(child => {
                html += `<tr>
                    <td>${child.firstName} ${child.lastName}</td>
                    <td>${child.group}</td>
                    <td>${child.age}</td>
                    <td>${child.balance.toFixed(2)}€</td>
                    <td>
                        <button class="btn btn-sm btn-outline-success" onclick="quickSearchDeposit('${child.id}')">
                            <i class="bi bi-cash-coin"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="quickSearchWithdraw('${child.id}')">
                            <i class="bi bi-cash"></i>
                        </button>
                    </td>
                </tr>`;
            });
            
            html += `</tbody></table></div></div>`;
        }
        
        // Transactions results
        if (results.transactions.length > 0) {
            html += `<div class="mb-4">
                <h6><i class="bi bi-credit-card me-2"></i>Συναλλαγές (${results.transactions.length})</h6>
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th>Ημερομηνία</th>
                                <th>Παιδί</th>
                                <th>Τύπος</th>
                                <th>Ποσό</th>
                                <th>Υπάλληλος</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            const children = safeGetFromStorage('pitsasChildren', []);
            results.transactions.slice(0, 20).forEach(transaction => { // Limit to 20 for performance
                const child = children.find(c => c.id === transaction.childId);
                const childName = child ? `${child.firstName} ${child.lastName}` : 'Άγνωστο';
                const date = new Date(transaction.date).toLocaleDateString('el-GR');
                const typeClass = transaction.type === 'deposit' ? 'text-success' : 'text-warning';
                const typeText = transaction.type === 'deposit' ? 'Κατάθεση' : 'Ανάληψη';
                
                html += `<tr>
                    <td>${date}</td>
                    <td>${childName}</td>
                    <td class="${typeClass}">${typeText}</td>
                    <td>${transaction.amount.toFixed(2)}€</td>
                    <td>${transaction.staff}</td>
                </tr>`;
            });
            
            if (results.transactions.length > 20) {
                html += `<tr><td colspan="5" class="text-center text-muted">
                    <small>Εμφανίζονται οι πρώτες 20 συναλλαγές από ${results.transactions.length} συνολικά</small>
                </td></tr>`;
            }
            
            html += `</tbody></table></div></div>`;
        }
        
        if (totalResults === 0) {
            html += `<div class="text-center text-muted py-4">
                <i class="bi bi-search" style="font-size: 3rem;"></i>
                <p class="mt-2">Δεν βρέθηκαν αποτελέσματα για τα κριτήρια αναζήτησης</p>
            </div>`;
        }
        
        html += `</div>`;
        resultsContainer.innerHTML = html;
    }
    
    function clearAdvancedSearch() {
        document.getElementById('adv-search-text').value = '';
        document.getElementById('adv-search-category').value = 'all';
        document.getElementById('adv-search-group').value = '';
        document.getElementById('adv-search-age-min').value = '';
        document.getElementById('adv-search-age-max').value = '';
        document.getElementById('adv-search-balance-min').value = '';
        document.getElementById('adv-search-balance-max').value = '';
        document.getElementById('adv-search-limit-status').value = '';
        document.getElementById('adv-search-date-from').value = '';
        document.getElementById('adv-search-date-to').value = '';
        document.getElementById('advanced-search-results').innerHTML = '';
    }
    
    function saveSearchPreset() {
        const searchName = prompt('Δώστε όνομα για αυτή την αναζήτηση:');
        if (!searchName) return;
        
        const searchParams = {
            name: searchName,
            text: document.getElementById('adv-search-text').value,
            category: document.getElementById('adv-search-category').value,
            group: document.getElementById('adv-search-group').value,
            ageMin: document.getElementById('adv-search-age-min').value,
            ageMax: document.getElementById('adv-search-age-max').value,
            balanceMin: document.getElementById('adv-search-balance-min').value,
            balanceMax: document.getElementById('adv-search-balance-max').value,
            limitStatus: document.getElementById('adv-search-limit-status').value,
            dateFrom: document.getElementById('adv-search-date-from').value,
            dateTo: document.getElementById('adv-search-date-to').value
        };
        
        const savedSearches = safeGetFromStorage('pitsa AdvancedSearchPresets', []);
        savedSearches.push(searchParams);
        safeSetToStorage('pitsasAdvancedSearchPresets', savedSearches);
        
        showNotification(`Η αναζήτηση "${searchName}" αποθηκεύτηκε επιτυχώς!`, 'success');
    }
    
    // Quick action functions for search results
    window.quickSearchDeposit = function(childId) {
        advancedSearchModal.hide();
        setTimeout(() => {
            prepareTransactionModal('deposit', childId);
        }, 300);
    };
    
    window.quickSearchWithdraw = function(childId) {
        advancedSearchModal.hide();
        setTimeout(() => {
            prepareTransactionModal('withdraw', childId);
        }, 300);
    };
    
    // Αρχικοποίηση αυτόματου backup συστήματος (async)
    initializeAutoBackup().catch(error => {
        console.error('Error initializing auto backup:', error);
    });
    
    // Fix για focus issues σε Electron - Enhanced version
    function initializeFocusFixes() {
        console.log('Αρχικοποίηση enhanced focus fixes...');
        
        // Γενικός focus fix για Electron - πιο αγρεσσικός
        window.addEventListener('click', function(e) {
            setTimeout(() => {
                if (window.electronAPI && window.electronAPI.focusMainWindow) {
                    window.electronAPI.focusMainWindow().catch(() => {
                        window.focus();
                        document.body.focus();
                    });
                }
            }, 10);
        });
        
        // Enhanced keyboard navigation
        document.addEventListener('keydown', function(e) {
            // Tab handling με επιπλέον έλεγχο
            if (e.key === 'Tab') {
                setTimeout(() => {
                    if (window.electronAPI) {
                        window.electronAPI.focusMainWindow().catch(() => {
                            window.focus();
                        });
                    }
                    
                    // Εάν δεν υπάρχει focused element, focus το body
                    if (!document.activeElement || document.activeElement === document.body) {
                        const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
                        for (let input of inputs) {
                            if (input.offsetParent !== null && !input.disabled) {
                                input.focus();
                                break;
                            }
                        }
                    }
                }, 50);
            }
            
            // Emergency focus restore με Ctrl+Alt+F
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                console.log('Emergency focus restore activated!');
                
                // Multiple fallbacks
                if (window.electronAPI && window.electronAPI.restoreFocus) {
                    window.electronAPI.restoreFocus().catch(err => {
                        console.log('Emergency restore focus failed:', err.message);
                    });
                }
                if (window.electronAPI && window.electronAPI.focusMainWindow) {
                    window.electronAPI.focusMainWindow().catch(err => {
                        console.log('Emergency focus main window failed:', err.message);
                    });
                }
                
                window.focus();
                document.body.focus();
                
                // Focus σε κάποιο input
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.style.display !== 'none') {
                    searchInput.focus();
                } else {
                    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
                    for (let input of inputs) {
                        if (input.offsetParent !== null && !input.disabled) {
                            input.focus();
                            break;
                        }
                    }
                }
                
                showNotification('Focus επαναφέρθηκε με force!', 'success');
            }
            
            // F1 - Help/Documentation shortcut
            if (e.key === 'F1') {
                e.preventDefault();
                showDocumentationModal();
                return;
            }
            
            // F2 - Beginner Guide shortcut  
            if (e.key === 'F2') {
                e.preventDefault();
                openDocumentationWindow('BEGINNER-GUIDE.md');
                return;
            }
            
            // Escape key handling
            if (e.key === 'Escape') {
                setTimeout(() => {
                    if (window.electronAPI) {
                        window.electronAPI.focusMainWindow().catch(err => {
                            console.log('Escape focus failed:', err.message);
                        });
                    }
                    window.focus();
                }, 50);
            }
        });
        
        // Window focus/blur events με enhanced handling
        window.addEventListener('focus', function() {
            console.log('Window gained focus');
            if (window.electronAPI && window.electronAPI.focusMainWindow) {
                window.electronAPI.focusMainWindow().catch(err => {
                    console.log('Window focus event failed:', err.message);
                });
            }
        });
        
        window.addEventListener('blur', function() {
            console.log('Window lost focus');
            // Αγρεσσική επαναφορά focus μετά από blur
            setTimeout(() => {
                const modalsOpen = document.querySelector('.modal.show');
                if (!modalsOpen && window.electronAPI) {
                    window.electronAPI.focusMainWindow().catch(() => {
                        window.focus();
                    });
                }
            }, 300);
        });
        
        // Modal handling με enhanced support
        document.addEventListener('show.bs.modal', function(e) {
            console.log('Modal opening:', e.target.id);
            setTimeout(() => {
                const modal = e.target;
                if (modal) {
                    modal.focus();
                    // Focus στο πρώτο focusable element
                    const focusable = modal.querySelector('input, textarea, select, button:not([disabled])');
                    if (focusable) {
                        focusable.focus();
                    }
                }
                
                if (window.electronAPI) {
                    window.electronAPI.focusMainWindow().catch(err => {
                        console.log('Modal show focus failed:', err.message);
                    });
                }
            }, 150);
        });
        
        document.addEventListener('hidden.bs.modal', function(e) {
            console.log('Modal closed:', e.target.id);
            setTimeout(() => {
                if (window.electronAPI) {
                    window.electronAPI.restoreFocus().catch(err => {
                        console.log('Modal hidden restore focus failed:', err.message);
                    });
                    window.electronAPI.focusMainWindow().catch(err => {
                        console.log('Modal hidden focus main window failed:', err.message);
                    });
                }
                
                window.focus();
                document.body.focus();
                
                // Focus restoration στο search input αν είναι ορατό
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.style.display !== 'none' && !searchInput.disabled) {
                    searchInput.focus();
                } else {
                    // Focus σε κάποιο άλλο input
                    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
                    for (let input of inputs) {
                        if (input.offsetParent !== null && !input.disabled) {
                            input.focus();
                            break;
                        }
                    }
                }
            }, 200);
        });
        
        // Periodic focus check - πιο συχνός έλεγχος
        setInterval(() => {
            const hasFocus = document.hasFocus();
            const modalsOpen = document.querySelector('.modal.show');
            
            if (!hasFocus && !modalsOpen && window.electronAPI) {
                console.log('Periodic focus restore attempt');
                window.electronAPI.restoreFocus().catch(() => {
                    window.focus();
                    document.body.focus();
                });
            }
        }, 5000); // Κάθε 5 δευτερόλεπτα
        
        // Document ready focus restoration
        if (document.readyState === 'complete') {
            setTimeout(() => {
                if (window.electronAPI) {
                    window.electronAPI.focusMainWindow().catch(err => {
                        console.log('Document ready focus failed:', err.message);
                    });
                }
                window.focus();
            }, 100);
        }
    }
    
    // Αρχικοποίηση focus fixes
    initializeFocusFixes();
    
    // ==================== DOCUMENTATION FUNCTIONS ====================
    
    // Simple markdown to HTML converter
    function convertMarkdownToHtml(markdown) {
        let html = markdown;
        
        // Escape HTML entities first
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Headers
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
        html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-decoration-none" target="_blank">$1 <i class="bi bi-box-arrow-up-right"></i></a>');
        
        // Code blocks (multi-line)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-light p-3 rounded"><code>$2</code></pre>');
        html = html.replace(/```\n([\s\S]*?)```/g, '<pre class="bg-light p-3 rounded"><code>$1</code></pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code class="bg-light px-1 rounded">$1</code>');
        
        // Blockquotes
        html = html.replace(/^&gt; (.*)$/gm, '<blockquote class="blockquote ps-3 border-start border-3 border-primary">$1</blockquote>');
        
        // Lists - ordered and unordered
        html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
        html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
        
        // Wrap consecutive list items in ul/ol
        html = html.replace(/(<li>.*?<\/li>\s*)+/g, function(match) {
            return '<ul class="list-unstyled">' + match + '</ul>';
        });
        
        // Tables (improved)
        html = html.replace(/\|([^|]+)\|/g, function(match, content) {
            return '<td class="border px-2 py-1">' + content.trim() + '</td>';
        });
        html = html.replace(/(<td.*?<\/td>)+/g, function(match) {
            return '<tr>' + match + '</tr>';
        });
        html = html.replace(/(<tr>.*?<\/tr>)+/g, function(match) {
            return '<table class="table table-bordered table-sm">' + match + '</table>';
        });
        
        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr class="my-4">');
        
        // Emojis and special characters
        html = html.replace(/:\w+:/g, function(match) {
            const emojiMap = {
                ':checkmark:': '✅',
                ':x:': '❌',
                ':warning:': '⚠️',
                ':info:': 'ℹ️',
                ':bulb:': '💡',
                ':rocket:': '🚀',
                ':gear:': '⚙️',
                ':book:': '📚',
                ':computer:': '💻',
                ':mobile:': '📱'
            };
            return emojiMap[match] || match;
        });
        
        // Break lines into paragraphs
        html = html.replace(/\n\n+/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragraph tags
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs and fix structure
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p><br><\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ol>.*?<\/ol>)<\/p>/g, '$1');
        html = html.replace(/<p>(<table>.*?<\/table>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>.*?<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>.*?<\/blockquote>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr[^>]*>)<\/p>/g, '$1');
        
        // Add Bootstrap classes for better styling
        html = html.replace(/<table>/g, '<table class="table table-striped table-hover">');
        html = html.replace(/<blockquote>/g, '<blockquote class="blockquote border-start border-3 border-primary ps-3 my-3">');
        html = html.replace(/<code>/g, '<code class="text-primary bg-light px-1 rounded">');
        
        return html;
    }
    
    // Load and display documentation
    async function loadDocumentation(filename, targetElementId) {
        const targetElement = document.getElementById(targetElementId);
        
        if (!targetElement) {
            console.error(`Target element ${targetElementId} not found`);
            return;
        }
        
        try {
            // Show loading
            targetElement.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Φόρτωση...</span>
                    </div>
                    <p class="mt-2">Φόρτωση ${filename}...</p>
                </div>
            `;
            
            // Read the file
            const result = await window.electronAPI.readDocumentation(filename);
            
            if (result.success) {
                // Convert markdown to HTML
                const htmlContent = convertMarkdownToHtml(result.content);
                targetElement.innerHTML = htmlContent;
                
                // Add smooth fade-in animation
                targetElement.style.opacity = '0';
                setTimeout(() => {
                    targetElement.style.transition = 'opacity 0.5s ease-in-out';
                    targetElement.style.opacity = '1';
                }, 100);
            } else {
                targetElement.innerHTML = `
                    <div class="alert alert-danger">
                        <h6><i class="bi bi-exclamation-triangle me-2"></i>Σφάλμα Φόρτωσης</h6>
                        <p>Δεν ήταν δυνατή η φόρτωση του αρχείου <strong>${filename}</strong>.</p>
                        <p class="mb-0"><small>Σφάλμα: ${result.error}</small></p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading documentation:', error);
            targetElement.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="bi bi-exclamation-triangle me-2"></i>Σφάλμα Σύνδεσης</h6>
                    <p>Δεν ήταν δυνατή η φόρτωση της τεκμηρίωσης.</p>
                    <p class="mb-0"><small>Σφάλμα: ${error.message}</small></p>
                </div>
            `;
        }
    }
    
    // Show documentation modal
    function showDocumentationModal() {
        // Load default documentation (beginner guide)
        loadDocumentation('BEGINNER-GUIDE.md', 'beginner-guide-html');
        
        // Set up tab change event listeners
        const tabs = document.querySelectorAll('#documentation-tabs button');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.getAttribute('data-bs-target').replace('#', '');
                const contentId = targetId.replace('-content', '-html');
                
                // Map tab to filename
                const fileMap = {
                    'beginner-guide-html': 'BEGINNER-GUIDE.md',
                    'auto-backup-html': 'AUTO_BACKUP_INFO.md',
                    'focus-fix-html': 'FOCUS_FIX_GUIDE.md',
                    'release-notes-html': 'RELEASE-NOTES.md',
                    'license-html': 'LICENSE'
                };
                
                const filename = fileMap[contentId];
                if (filename) {
                    loadDocumentation(filename, contentId);
                }
            });
        });
        
        documentationModal.show();
    }
    
    // Open documentation in separate window
    function openDocumentationWindow(filename) {
        // Map filename to title
        const titleMap = {
            'BEGINNER-GUIDE.md': 'Οδηγός για Αρχάριους',
            'AUTO_BACKUP_INFO.md': 'Auto Backup System',
            'FOCUS_FIX_GUIDE.md': 'Focus Fix Guide',
            'RELEASE-NOTES.md': 'Release Notes',
            'LICENSE': 'License'
        };
        
        const title = titleMap[filename] || 'Τεκμηρίωση';
        
        // Set modal title
        document.getElementById('doc-window-title').innerHTML = `<i class="bi bi-book me-2"></i>${title}`;
        
        // Load content
        loadDocumentation(filename, 'doc-window-content');
        
        // Show modal
        documentationWindowModal.show();
    }
    
    // Make function available globally
    window.openDocumentationWindow = openDocumentationWindow;
    
    // ==================== EXCEL IMPORT FUNCTIONS ====================
    
    let excelImportData = null;
    let excelImportStep = 1;
    
    // Show Excel import modal
    function showExcelImportModal() {
        resetExcelImportModal();
        excelImportModal.show();
    }
    
    // Reset modal to initial state
    function resetExcelImportModal() {
        excelImportStep = 1;
        excelImportData = null;
        
        // Show step 1, hide others
        document.getElementById('excel-step-1').classList.remove('d-none');
        document.getElementById('excel-step-2').classList.add('d-none');
        document.getElementById('excel-step-3').classList.add('d-none');
        
        // Reset buttons
        document.getElementById('next-step-btn').classList.add('d-none');
        document.getElementById('import-data-btn').classList.add('d-none');
        
        // Reset progress
        document.getElementById('import-progress').style.width = '0%';
        document.getElementById('import-status').textContent = 'Έτοιμο για εισαγωγή...';
        
        // Clear validation results
        document.getElementById('validation-results').classList.add('d-none');
    }
    
    // Initialize Excel import events (only once)
    let excelImportEventsInitialized = false;
    
    function initializeExcelImportEvents() {
        // Prevent multiple initialization
        if (excelImportEventsInitialized) return;
        
        // File selection button
        const selectExcelBtn = document.getElementById('select-excel-btn');
        if (selectExcelBtn) {
            selectExcelBtn.addEventListener('click', selectExcelFile);
        }
        
        // Drop zone events
        const dropZone = document.getElementById('excel-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('drop', handleDrop);
            dropZone.addEventListener('dragleave', handleDragLeave);
        }
        
        // Navigation buttons
        const backToSelectionBtn = document.getElementById('back-to-selection');
        const nextStepBtn = document.getElementById('next-step-btn');
        const importDataBtn = document.getElementById('import-data-btn');
        
        if (backToSelectionBtn) {
            backToSelectionBtn.addEventListener('click', () => showExcelStep(1));
        }
        if (nextStepBtn) {
            nextStepBtn.addEventListener('click', nextExcelStep);
        }
        if (importDataBtn) {
            importDataBtn.addEventListener('click', importExcelData);
        }
        
        excelImportEventsInitialized = true;
    }
    
    // Handle file selection
    async function selectExcelFile() {
        try {
            const result = await window.electronAPI.selectExcelFile();
            if (result.success) {
                await processSelectedFile(result.filePath, result.fileName, result.fileExtension);
            } else {
                showNotification('Δεν επιλέχθηκε αρχείο', 'info');
            }
        } catch (error) {
            console.error('Error selecting file:', error);
            showNotification('Σφάλμα κατά την επιλογή αρχείου', 'error');
        }
    }
    
    // Handle drag and drop
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('dragover');
    }
    
    function handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const filePath = file.path;
            const fileName = file.name;
            const fileExtension = path.extname(fileName).toLowerCase();
            
            processSelectedFile(filePath, fileName, fileExtension);
        }
    }
    
    // Process selected file
    async function processSelectedFile(filePath, fileName, fileExtension) {
        try {
            // Show loading
            document.getElementById('import-status').textContent = 'Διάβασμα αρχείου...';
            
            // Read file content
            const result = await window.electronAPI.readExcelFile(filePath);
            
            if (result.success) {
                // Parse file content
                const parsedData = parseFileContent(result.content, result.fileExtension);
                
                if (parsedData.success) {
                    excelImportData = {
                        fileName: fileName,
                        fileExtension: fileExtension,
                        headers: parsedData.headers,
                        rows: parsedData.rows,
                        totalRecords: parsedData.rows.length
                    };
                    
                    // Show step 2 (preview)
                    showExcelStep(2);
                    populateDataPreview();
                } else {
                    showNotification('Σφάλμα στην ανάγνωση του αρχείου: ' + parsedData.error, 'error');
                }
            } else {
                showNotification('Σφάλμα στη φόρτωση αρχείου: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error processing file:', error);
            showNotification('Σφάλμα στην επεξεργασία αρχείου', 'error');
        }
    }
    
    // Parse file content based on file type
    function parseFileContent(content, fileExtension) {
        try {
            if (fileExtension === '.csv') {
                return parseCSVContent(content);
            } else {
                // For Excel files, we'd need a library like xlsx
                // For now, we'll return an error
                return { success: false, error: 'Τα Excel αρχεία δεν υποστηρίζονται ακόμα. Χρησιμοποιήστε CSV.' };
            }
        } catch (error) {
            return { success: false, error: 'Σφάλμα στην ανάλυση αρχείου' };
        }
    }
    
    // Parse CSV content
    function parseCSVContent(content) {
        try {
            const lines = content.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                return { success: false, error: 'Το αρχείο είναι κενό' };
            }
            
            // Parse headers
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            // Parse data rows
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });
                    rows.push(row);
                }
            }
            
            return {
                success: true,
                headers: headers,
                rows: rows
            };
        } catch (error) {
            return { success: false, error: 'Σφάλμα στην ανάλυση CSV' };
        }
    }
    
    // Show specific Excel import step
    function showExcelStep(step) {
        // Hide all steps
        document.getElementById('excel-step-1').classList.add('d-none');
        document.getElementById('excel-step-2').classList.add('d-none');
        document.getElementById('excel-step-3').classList.add('d-none');
        
        // Show target step
        document.getElementById(`excel-step-${step}`).classList.remove('d-none');
        document.getElementById(`excel-step-${step}`).classList.add('fade-in');
        
        excelImportStep = step;
        
        // Update buttons
        updateExcelImportButtons();
    }
    
    // Update import buttons based on current step
    function updateExcelImportButtons() {
        const nextBtn = document.getElementById('next-step-btn');
        const importBtn = document.getElementById('import-data-btn');
        
        nextBtn.classList.add('d-none');
        importBtn.classList.add('d-none');
        
        if (excelImportStep === 2) {
            nextBtn.classList.remove('d-none');
        } else if (excelImportStep === 3) {
            importBtn.classList.remove('d-none');
        }
    }
    
    // Go to next step
    function nextExcelStep() {
        if (excelImportStep === 2) {
            // Validate data before proceeding
            const validationResult = validateExcelData();
            if (validationResult.canProceed) {
                showExcelStep(3);
            } else {
                showNotification('Παρακαλώ διορθώστε τα σφάλματα πριν συνεχίσετε', 'warning');
            }
        }
    }
    
    // Populate data preview
    function populateDataPreview() {
        if (!excelImportData) return;
        
        // Update file info
        document.getElementById('selected-file-name').value = excelImportData.fileName;
        document.getElementById('total-records').value = excelImportData.totalRecords;
        
        // Create column mapping
        createColumnMapping();
        
        // Create preview table
        createPreviewTable();
        
        // Validate data
        const validationResult = validateExcelData();
        showValidationResults(validationResult);
    }
    
    // Create column mapping interface
    function createColumnMapping() {
        const mappingContainer = document.getElementById('column-mapping');
        
        // Store existing selections before clearing
        const existingSelections = {};
        const existingSelects = mappingContainer.querySelectorAll('select');
        existingSelects.forEach(select => {
            existingSelections[select.id] = select.value;
        });
        
        mappingContainer.innerHTML = '';
        
        const requiredFields = [
            { key: 'firstName', label: 'Όνομα', required: true },
            { key: 'lastName', label: 'Επώνυμο', required: true },
            { key: 'age', label: 'Ηλικία', required: true },
            { key: 'group', label: 'Ομάδα', required: true },
            { key: 'dailyLimit', label: 'Ημερήσιο Όριο', required: false },
            { key: 'initialBalance', label: 'Αρχικό Υπόλοιπο', required: false }
        ];
        
        requiredFields.forEach(field => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-4 mb-3';
            
            const mappingItem = document.createElement('div');
            mappingItem.className = 'column-mapping-item';
            
            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = field.label + (field.required ? ' *' : '');
            
            const select = document.createElement('select');
            select.className = 'form-select form-select-sm';
            select.id = `map-${field.key}`;
            
            // Add options
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '-- Επιλέξτε στήλη --';
            select.appendChild(emptyOption);
            
            excelImportData.headers.forEach(header => {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                
                // Restore previous selection if exists
                if (existingSelections[select.id] === header) {
                    option.selected = true;
                }
                // Auto-select if similar name and no previous selection
                else if (!existingSelections[select.id]) {
                    if (field.key === 'firstName' && (header.toLowerCase().includes('όνομα') || header.toLowerCase().includes('name'))) {
                        option.selected = true;
                    } else if (field.key === 'lastName' && (header.toLowerCase().includes('επώνυμο') || header.toLowerCase().includes('surname'))) {
                        option.selected = true;
                    } else if (field.key === 'age' && (header.toLowerCase().includes('ηλικία') || header.toLowerCase().includes('age'))) {
                        option.selected = true;
                    } else if (field.key === 'group' && (header.toLowerCase().includes('ομάδα') || header.toLowerCase().includes('group'))) {
                        option.selected = true;
                    } else if (field.key === 'dailyLimit' && (header.toLowerCase().includes('όριο') || header.toLowerCase().includes('limit'))) {
                        option.selected = true;
                    } else if (field.key === 'initialBalance' && (header.toLowerCase().includes('υπόλοιπο') || header.toLowerCase().includes('balance'))) {
                        option.selected = true;
                    }
                }
                
                select.appendChild(option);
            });
            
            mappingItem.appendChild(label);
            mappingItem.appendChild(select);
            colDiv.appendChild(mappingItem);
            mappingContainer.appendChild(colDiv);
        });
    }
    
    // Create preview table
    function createPreviewTable() {
        const headerRow = document.getElementById('preview-header');
        const bodyContainer = document.getElementById('preview-body');
        
        headerRow.innerHTML = '';
        bodyContainer.innerHTML = '';
        
        // Create headers
        excelImportData.headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        // Create rows (max 10 for preview)
        const maxRows = Math.min(10, excelImportData.rows.length);
        for (let i = 0; i < maxRows; i++) {
            const row = excelImportData.rows[i];
            const tr = document.createElement('tr');
            
            excelImportData.headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                tr.appendChild(td);
            });
            
            bodyContainer.appendChild(tr);
        }
    }
    
    // Validate Excel data
    function validateExcelData() {
        let validCount = 0;
        let warningCount = 0;
        let errorCount = 0;
        
        // Check if all required mappings are set
        const requiredMappings = ['firstName', 'lastName', 'age', 'group'];
        const mappingErrors = [];
        
        requiredMappings.forEach(field => {
            const select = document.getElementById(`map-${field}`);
            if (!select || !select.value) {
                mappingErrors.push(`Δεν έχει οριστεί αντιστοίχιση για: ${field}`);
                errorCount++;
            }
        });
        
        if (mappingErrors.length === 0) {
            // Validate data rows
            excelImportData.rows.forEach(row => {
                const issues = validateRowData(row);
                if (issues.errors.length > 0) {
                    errorCount++;
                } else if (issues.warnings.length > 0) {
                    warningCount++;
                } else {
                    validCount++;
                }
            });
        }
        
        return {
            validCount,
            warningCount,
            errorCount,
            canProceed: errorCount === 0,
            mappingErrors
        };
    }
    
    // Validate individual row data
    function validateRowData(row) {
        const errors = [];
        const warnings = [];
        
        // Get field mappings
        const firstNameField = document.getElementById('map-firstName')?.value;
        const lastNameField = document.getElementById('map-lastName')?.value;
        const ageField = document.getElementById('map-age')?.value;
        const groupField = document.getElementById('map-group')?.value;
        
        // Validate required fields
        if (!row[firstNameField] || row[firstNameField].trim() === '') {
            errors.push('Το όνομα είναι υποχρεωτικό');
        }
        
        if (!row[lastNameField] || row[lastNameField].trim() === '') {
            errors.push('Το επώνυμο είναι υποχρεωτικό');
        }
        
        if (!row[ageField] || isNaN(parseInt(row[ageField]))) {
            errors.push('Η ηλικία πρέπει να είναι αριθμός');
        } else {
            const age = parseInt(row[ageField]);
            if (age < 5 || age > 18) {
                warnings.push('Η ηλικία φαίνεται ασυνήθιστη (5-18)');
            }
        }
        
        if (!row[groupField] || row[groupField].trim() === '') {
            errors.push('Η ομάδα είναι υποχρεωτική');
        }
        
        return { errors, warnings };
    }
    
    // Show validation results
    function showValidationResults(validationResult) {
        const resultsContainer = document.getElementById('validation-results');
        
        document.getElementById('valid-count').textContent = validationResult.validCount;
        document.getElementById('warning-count').textContent = validationResult.warningCount;
        document.getElementById('error-count').textContent = validationResult.errorCount;
        
        resultsContainer.classList.remove('d-none');
        
        if (validationResult.errorCount > 0) {
            resultsContainer.className = 'alert alert-danger';
        } else if (validationResult.warningCount > 0) {
            resultsContainer.className = 'alert alert-warning';
        } else {
            resultsContainer.className = 'alert alert-success';
        }
    }
    
    // Import Excel data
    async function importExcelData() {
        try {
            const importBtn = document.getElementById('import-data-btn');
            const progressBar = document.getElementById('import-progress');
            const statusText = document.getElementById('import-status');
            
            // Disable button and show progress
            importBtn.disabled = true;
            statusText.textContent = 'Εισαγωγή δεδομένων...';
            
            // Get settings
            const skipDuplicates = document.getElementById('skip-duplicates').checked;
            const updateExisting = document.getElementById('update-existing').checked;
            const defaultDailyLimit = parseFloat(document.getElementById('default-daily-limit').value) || 10;
            const defaultInitialBalance = parseFloat(document.getElementById('default-initial-balance').value) || 0;
            
            // Get field mappings
            const mappings = {
                firstName: document.getElementById('map-firstName').value,
                lastName: document.getElementById('map-lastName').value,
                age: document.getElementById('map-age').value,
                group: document.getElementById('map-group').value,
                dailyLimit: document.getElementById('map-dailyLimit').value,
                initialBalance: document.getElementById('map-initialBalance').value
            };
            
            // Get existing children
            const existingChildren = safeGetFromStorage('pitsasChildren', []);
            const importedChildren = [];
            const skippedChildren = [];
            const updatedChildren = [];
            
            // Process each row
            for (let i = 0; i < excelImportData.rows.length; i++) {
                const row = excelImportData.rows[i];
                
                // Update progress
                const progress = ((i + 1) / excelImportData.rows.length) * 100;
                progressBar.style.width = progress + '%';
                statusText.textContent = `Εισαγωγή ${i + 1} από ${excelImportData.rows.length}...`;
                
                // Create child object
                const childData = {
                    id: Date.now() + i,
                    firstName: row[mappings.firstName]?.trim() || '',
                    lastName: row[mappings.lastName]?.trim() || '',
                    age: parseInt(row[mappings.age]) || 0,
                    group: row[mappings.group]?.trim() || '',
                    dailyLimit: parseFloat(row[mappings.dailyLimit]) || defaultDailyLimit,
                    balance: parseFloat(row[mappings.initialBalance]) || defaultInitialBalance,
                    dailySpent: 0,
                    registrationDate: new Date().toISOString(),
                    lastTransaction: null,
                    notes: `Εισήχθη από Excel: ${excelImportData.fileName}`,
                    active: true
                };
                
                // Check for duplicates
                const existingChild = existingChildren.find(child => 
                    child.firstName.toLowerCase() === childData.firstName.toLowerCase() &&
                    child.lastName.toLowerCase() === childData.lastName.toLowerCase()
                );
                
                if (existingChild) {
                    if (skipDuplicates && !updateExisting) {
                        skippedChildren.push(childData);
                        continue;
                    } else if (updateExisting) {
                        // Update existing child
                        Object.assign(existingChild, childData);
                        existingChild.id = existingChild.id; // Keep original ID
                        updatedChildren.push(existingChild);
                    }
                } else {
                    // Add new child
                    existingChildren.push(childData);
                    importedChildren.push(childData);
                }
                
                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Save updated children
            safeSetToStorage('pitsasChildren', existingChildren);
            
            // Show completion
            progressBar.style.width = '100%';
            statusText.className = 'text-success';
            statusText.textContent = `Εισαγωγή ολοκληρώθηκε! Νέα: ${importedChildren.length}, Ενημερώθηκαν: ${updatedChildren.length}, Παραλείφθηκαν: ${skippedChildren.length}`;
            
            // Show success notification
            showNotification(`Εισήχθησαν ${importedChildren.length} νέα παιδιά από Excel`, 'success');
            
            // Close modal after delay
            setTimeout(() => {
                excelImportModal.hide();
                refreshCurrentView();
            }, 2000);
            
        } catch (error) {
            console.error('Error importing Excel data:', error);
            showNotification('Σφάλμα κατά την εισαγωγή δεδομένων', 'error');
        } finally {
            document.getElementById('import-data-btn').disabled = false;
        }
    }
    
    // Make Excel import function available globally
    window.showExcelImportModal = showExcelImportModal;
    
    // ==================== CONFIRM MODAL FUNCTIONS ====================
    
    // Show confirmation modal as a replacement for confirm()
    function showConfirmModal(title, message) {
        return new Promise((resolve) => {
            // Create or get existing confirm modal
            let confirmModal = document.getElementById('confirmModal');
            if (!confirmModal) {
                confirmModal = createConfirmModal();
                document.body.appendChild(confirmModal);
            }
            
            // Set title and message
            document.getElementById('confirmModalTitle').textContent = title;
            document.getElementById('confirmModalMessage').textContent = message;
            
            // Get or create modal instance (reuse if exists)
            let modal = bootstrap.Modal.getInstance(confirmModal);
            if (!modal) {
                modal = new bootstrap.Modal(confirmModal);
            }
            
            // Handle buttons
            const confirmBtn = document.getElementById('confirmModalConfirm');
            const cancelBtn = document.getElementById('confirmModalCancel');
            
            // Clear any existing listeners first
            const newConfirmBtn = confirmBtn.cloneNode(true);
            const newCancelBtn = cancelBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            
            const handleConfirm = () => {
                modal.hide();
                resolve(true);
            };
            
            const handleCancel = () => {
                modal.hide();
                resolve(false);
            };
            
            const handleHidden = () => {
                confirmModal.removeEventListener('hidden.bs.modal', handleHidden);
                // Don't resolve here if already resolved
            };
            
            // Add event listeners
            newConfirmBtn.addEventListener('click', handleConfirm);
            newCancelBtn.addEventListener('click', handleCancel);
            confirmModal.addEventListener('hidden.bs.modal', handleHidden, { once: true });
            
            // Show modal
            modal.show();
        });
    }
    
    // Create confirm modal HTML
    function createConfirmModal() {
        const modalHtml = `
            <div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalTitle" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="confirmModalTitle">Επιβεβαίωση</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p id="confirmModalMessage">Είστε σίγουροι;</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="confirmModalCancel" data-bs-dismiss="modal">Άκυρο</button>
                            <button type="button" class="btn btn-primary" id="confirmModalConfirm">Επιβεβαίωση</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        return div.firstElementChild;
    }
    
    // Show alert modal as a replacement for alert()
    function showAlertModal(title, message) {
        return new Promise((resolve) => {
            // Create or get existing alert modal
            let alertModal = document.getElementById('alertModal');
            if (!alertModal) {
                alertModal = createAlertModal();
                document.body.appendChild(alertModal);
            }
            
            // Set title and message
            document.getElementById('alertModalTitle').textContent = title;
            document.getElementById('alertModalMessage').textContent = message;
            
            // Get or create modal instance (reuse if exists)
            let modal = bootstrap.Modal.getInstance(alertModal);
            if (!modal) {
                modal = new bootstrap.Modal(alertModal);
            }
            
            // Handle close button
            const okBtn = document.getElementById('alertModalOk');
            
            // Clear any existing listeners first
            const newOkBtn = okBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOkBtn, okBtn);
            
            const handleClose = () => {
                modal.hide();
                resolve();
            };
            
            const handleHidden = () => {
                alertModal.removeEventListener('hidden.bs.modal', handleHidden);
                // Don't resolve here if already resolved
            };
            
            // Add event listeners
            newOkBtn.addEventListener('click', handleClose);
            alertModal.addEventListener('hidden.bs.modal', handleHidden, { once: true });
            
            // Show modal
            modal.show();
        });
    }
    
    // Create alert modal HTML
    function createAlertModal() {
        const modalHtml = `
            <div class="modal fade" id="alertModal" tabindex="-1" aria-labelledby="alertModalTitle" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="alertModalTitle">Ειδοποίηση</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p id="alertModalMessage">Μήνυμα</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="alertModalOk" data-bs-dismiss="modal">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        return div.firstElementChild;
    }

    // ==================== SELECTIVE UPDATE FUNCTIONS ====================
    // These functions update specific parts of the UI without full page reloads
    
    function updateDashboardStats() {
        try {
            console.log('Updating dashboard stats without full reload');
            
            const children = safeGetFromStorage('pitsasChildren', []);
            const transactions = safeGetFromStorage('pitsasTransactions', []);
            
            // Update total children count
            const totalChildrenElement = document.querySelector('#total-children-count');
            if (totalChildrenElement) {
                totalChildrenElement.textContent = children.length;
            }
            
            // Update total balance
            const totalBalance = children.reduce((sum, child) => sum + child.balance, 0);
            const totalBalanceElement = document.querySelector('#total-balance-amount');
            if (totalBalanceElement) {
                totalBalanceElement.textContent = totalBalance.toFixed(2) + '€';
            }
            
            // Update today's transactions count
            const today = new Date().toISOString().split('T')[0];
            const todayTransactions = transactions.filter(t => t.date.startsWith(today));
            const todayTransactionsElement = document.querySelector('#today-transactions-count');
            if (todayTransactionsElement) {
                todayTransactionsElement.textContent = todayTransactions.length;
            }
            
            // Update recent activity (last 5 transactions)
            updateRecentActivity();
            
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }
    
    function updateChildRowInTable(childId) {
        try {
            console.log('Updating child row in table without full reload:', childId);
            
            const children = safeGetFromStorage('pitsasChildren', []);
            const child = children.find(c => c.id === childId);
            
            if (!child) {
                console.warn('Child not found for update:', childId);
                return;
            }
            
            // Find the row in the table
            const childRow = document.querySelector(`tr[data-child-id="${childId}"]`);
            
            if (childRow) {
                // Update existing row
                updateChildRowContent(childRow, child);
            } else {
                // If row doesn't exist, it's a new child - add it to the table
                const tableBody = document.querySelector('#children-list tbody');
                if (tableBody) {
                    const newRow = createChildRow(child);
                    tableBody.insertBefore(newRow, tableBody.firstChild);
                }
            }
            
        } catch (error) {
            console.error('Error updating child row:', error);
            // Fallback to full reload if selective update fails
            console.log('Falling back to full children reload');
            loadChildren();
        }
    }
    
    function updateChildRowContent(row, child) {
        // Update balance column
        const balanceCell = row.querySelector('.child-balance');
        if (balanceCell) {
            balanceCell.textContent = child.balance.toFixed(2) + '€';
            
            // Update color based on balance
            balanceCell.className = 'child-balance';
            if (child.balance > 20) {
                balanceCell.classList.add('text-success');
            } else if (child.balance > 5) {
                balanceCell.classList.add('text-warning');
            } else {
                balanceCell.classList.add('text-danger');
            }
        }
        
        // Update daily spent
        const dailySpentCell = row.querySelector('.child-daily-spent');
        if (dailySpentCell && child.dailyLimit > 0) {
            dailySpentCell.textContent = `${child.todaySpent.toFixed(2)}€ / ${child.dailyLimit.toFixed(2)}€`;
        }
    }
    
    function createChildRow(child) {
        const row = document.createElement('tr');
        row.setAttribute('data-child-id', child.id);
        
        // Basic row structure - this is a simplified version
        row.innerHTML = `
            <td>${child.campId}</td>
            <td>${child.firstName} ${child.lastName}</td>
            <td>${child.age}</td>
            <td>${child.group}</td>
            <td class="child-balance">${child.balance.toFixed(2)}€</td>
            <td class="child-daily-spent">${child.todaySpent?.toFixed(2) || '0.00'}€ / ${child.dailyLimit?.toFixed(2) || '0.00'}€</td>
            <td>
                <button class="btn btn-sm btn-success me-1" onclick="prepareTransactionModal('deposit', '${child.id}')">
                    <i class="bi bi-plus-circle"></i>
                </button>
                <button class="btn btn-sm btn-warning me-1" onclick="prepareTransactionModal('withdraw', '${child.id}')">
                    <i class="bi bi-dash-circle"></i>
                </button>
                <button class="btn btn-sm btn-info me-1" onclick="showIdCard('${child.id}')">
                    <i class="bi bi-card-text"></i>
                </button>
            </td>
        `;
        
        return row;
    }
    
    function prependTransactionToTable(transaction) {
        try {
            console.log('Adding new transaction to table without full reload:', transaction.id);
            
            const tableBody = document.querySelector('#transactions-list tbody');
            if (!tableBody) return;
            
            const children = safeGetFromStorage('pitsasChildren', []);
            const child = children.find(c => c.id === transaction.childId);
            const childName = child ? `${child.firstName} ${child.lastName}` : 'Άγνωστο παιδί';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleString('el-GR')}</td>
                <td>${childName}</td>
                <td>
                    <span class="badge bg-${transaction.type === 'deposit' ? 'success' : 'warning'}">
                        ${transaction.type === 'deposit' ? 'Κατάθεση' : 'Ανάληψη'}
                    </span>
                </td>
                <td>${transaction.amount.toFixed(2)}€</td>
                <td>${transaction.staff}</td>
                <td>${transaction.notes || ''}</td>
            `;
            
            // Add to top of table
            tableBody.insertBefore(row, tableBody.firstChild);
            
            // Add animation
            row.style.opacity = '0';
            row.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 10);
            
        } catch (error) {
            console.error('Error adding transaction to table:', error);
        }
    }
    
    function updateStatisticsData() {
        try {
            console.log('Updating statistics data without full reload');
            
            // This would update specific statistics elements
            const children = safeGetFromStorage('pitsasChildren', []);
            const transactions = safeGetFromStorage('pitsasTransactions', []);
            
            // Update key statistics
            const totalChildrenStat = document.querySelector('#stats-total-children');
            if (totalChildrenStat) {
                totalChildrenStat.textContent = children.length;
            }
            
            const totalTransactionsStat = document.querySelector('#stats-total-transactions');
            if (totalTransactionsStat) {
                totalTransactionsStat.textContent = transactions.length;
            }
            
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }
    
    function updateRecentActivity() {
        try {
            const transactions = safeGetFromStorage('pitsasTransactions', []);
            const children = safeGetFromStorage('pitsasChildren', []);
            
            // Get recent transactions (last 5)
            const recentTransactions = transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
            
            const activityContainer = document.querySelector('#recent-activity-list');
            if (!activityContainer) return;
            
            activityContainer.innerHTML = '';
            
            recentTransactions.forEach(transaction => {
                const child = children.find(c => c.id === transaction.childId);
                const childName = child ? `${child.firstName} ${child.lastName}` : 'Άγνωστο';
                
                const activityItem = document.createElement('div');
                activityItem.className = 'list-group-item';
                activityItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${childName}</h6>
                        <small>${new Date(transaction.date).toLocaleTimeString('el-GR')}</small>
                    </div>
                    <p class="mb-1">${transaction.type === 'deposit' ? 'Κατάθεση' : 'Ανάληψη'} ${transaction.amount.toFixed(2)}€</p>
                `;
                
                activityContainer.appendChild(activityItem);
            });
            
        } catch (error) {
            console.error('Error updating recent activity:', error);
        }
    }
});