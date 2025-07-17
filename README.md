# 🏦 Pitsas Camp Bank

> Σύστημα διαχείρισης χρημάτων για κατασκηνώσεις - Ψηφιακή τράπεζα κατασκηνωτών

![License]
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?logo=bootstrap&logoColor=white)

## 📋 Περιγραφή

Το **Pitsas Camp Bank** είναι ένα ολοκληρωμένο web application για τη διαχείριση των χρημάτων των παιδιών σε κατασκηνώσεις. Παρέχει ένα ασφαλές και εύκολο στη χρήση σύστημα για:

- 💰 Διαχείριση υπολοίπων κατασκηνωτών
- 📊 Παρακολούθηση συναλλαγών
- 👥 Οργάνωση ομάδων
- 🔒 Έλεγχο ημερήσιων ορίων
- 📱 Responsive design για όλες τις συσκευές

## ✨ Χαρακτηριστικά

### 🎯 **Βασικές Λειτουργίες**
- **Εγγραφή παιδιών** με προσωπικά στοιχεία και ομάδα
- **Καταθέσεις/Αναλήψεις** με πλήρη παρακολούθηση
- **Ημερήσια όρια** με δυνατότητα παράκαμψης
- **Ιστορικό συναλλαγών** με αναλυτικές πληροφορίες
- **Αναζήτηση και φιλτράρισμα** για γρήγορη πρόσβαση

### 🎨 **Διεπαφή Χρήστη**
- **Bootstrap 5** για σύγχρονο design
- **Dark/Light mode** για άνετη χρήση
- **Responsive design** για desktop/tablet/mobile
- **Keyboard shortcuts** για γρήγορη πλοήγηση
- **Smart alerts** και ειδοποιήσεις

### 🔐 **Ασφάλεια & Διαχείριση**
- **Multi-user σύστημα** (Admin, Staff)
- **Backup/Restore** δεδομένων
- **Export σε CSV/JSON** για αρχειοθέτηση
- **Offline λειτουργία** με localStorage

### 🏕️ **Ομάδες Κατασκήνωσης**
- `junior` - Μικρότερα παιδιά
- `1η κοινότητα` - Πρώτη ομάδα
- `2η κοινότητα` - Δεύτερη ομάδα  
- `3η κοινότητα` - Τρίτη ομάδα
- `Πανοράματα` - Ειδική ομάδα
- `Προάστια` - Περιοχή προαστίων
- `Ανεξάρτητη` - Ανεξάρτητα μέλη
- `Ανεξάρτητες` - Ανεξάρτητες δραστηριότητες

## 🚀 Γρήγορη Εκκίνηση

### Προαπαιτούμενα
- 🌐 Σύγχρονος web browser (Chrome, Firefox, Safari, Edge)
- 📁 Web server (προαιρετικό για τοπική ανάπτυξη)

### Εγκατάσταση

1. **Clone το repository:**
```bash
git clone https://github.com/Lazpal/pitsas-bank.git
cd pitsas-bank
```

2. **Άνοιγμα με web server:**
```bash
άνοιξε το αρχείο -> Bank System start.bat
```

### Πρώτη Σύνδεση

**Προεπιλεγμένοι λογαριασμοί:**

| Χρήστης | Κωδικός | Ρόλος |
|---------|---------|-------|
| `admin` | `admin123` | Διαχειριστής |
| `staff1` | `staff123` | Προσωπικό |

## 📖 Οδηγός Χρήσης

### 1. **Εγγραφή Νέου Παιδιού**
- Κλικ στο κουμπί "Προσθήκη Παιδιού"
- Συμπλήρωση στοιχείων (όνομα, επώνυμο, ηλικία, ομάδα)
- Ορισμός ημερήσιου ορίου
- Αρχική κατάθεση (προαιρετικό)

### 2. **Διαχείριση Χρημάτων**
- **Κατάθεση:** Προσθήκη χρημάτων στο λογαριασμό
- **Ανάληψη:** Αφαίρεση χρημάτων με έλεγχο ορίων
- **Παράκαμψη ορίου:** Για έκτακτες περιπτώσεις

### 3. **Αναφορές & Στατιστικά**
- Προβολή συνολικών υπολοίπων ανά ομάδα
- Ημερήσιες/εβδομαδιαίες αναφορές
- Export δεδομένων για ανάλυση

## ⌨️ Συντομεύσεις Πληκτρολογίου

| Συντόμευση | Λειτουργία |
|------------|------------|
| `Ctrl + N` | Νέο παιδί |
| `Ctrl + F` | Αναζήτηση |
| `Ctrl + S` | Αποθήκευση |
| `Ctrl + E` | Export δεδομένων |
| `Ctrl + B` | Backup |
| `Ctrl + R` | Restore |
| `Ctrl + D` | Dark mode |
| `Esc` | Κλείσιμο modal |

## 🛠️ Τεχνική Τεκμηρίωση

### Δομή Αρχείων
```
pitsas-camp-bank/
├── index.html              # Κύρια σελίδα
├── app.js                  # JavaScript λογική
├── styles.css              # CSS styling
├── img/
│   ├── logo.png           # Logo εφαρμογής
│   └── favicon.png        # Favicon
├── *.json                 # Backup αρχεία
├── LICENSE                # Άδεια χρήσης
└── README.md              # Αυτό το αρχείο
```

### Τεχνολογίες
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Styling:** Bootstrap 5.3
- **Icons:** Bootstrap Icons
- **Storage:** localStorage API
- **Responsive:** CSS Grid & Flexbox

### Αποθήκευση Δεδομένων
```javascript
// Δομή δεδομένων στο localStorage
{
  "pitsasChildren": [...],      // Στοιχεία παιδιών
  "pitsasTransactions": [...],  // Συναλλαγές
  "pitsasUsers": [...],         // Χρήστες συστήματος
  "pitsasSettings": {...}       // Ρυθμίσεις εφαρμογής
}
```

## 🔧 Παραμετροποίηση

### Ρυθμίσεις Εφαρμογής
- **Items per page:** Αριθμός εγγραφών ανά σελίδα
- **Default daily limit:** Προεπιλεγμένο ημερήσιο όριο
- **Auto backup:** Αυτόματη δημιουργία αντιγράφων
- **Sound notifications:** Ηχητικές ειδοποιήσεις
- **Dark mode:** Σκούρο θέμα
- **Keyboard shortcuts:** Συντομεύσεις πληκτρολογίου

### Προσθήκη Νέων Ομάδων
Επεξεργασία του `index.html` στο section των ομάδων:
```html
<option value="νέα-ομάδα">Νέα Ομάδα</option>
```

## 📊 Demo Data

Το project περιλαμβάνει εκτεταμένα demo δεδομένα:
- **50 παιδιά** με ρεαλιστικά στοιχεία
- **95+ συναλλαγές** για δοκιμές
- **Όλες οι ομάδες** με μέλη
- **Ποικιλία ηλικιών** (8-17 ετών)

## 🐛 Troubleshooting

### Συνήθη Προβλήματα

**1. Τα δεδομένα δεν αποθηκεύονται:**
- Βεβαιωθείτε ότι το localStorage είναι ενεργοποιημένο
- Ελέγξτε τις ρυθμίσεις privacy του browser

**2. Το backup δεν λειτουργεί:**
- Δοκιμάστε σε διαφορετικό browser
- Ελέγξτε τις ρυθμίσεις downloads

**3. Responsive issues:**
- Κάντε refresh τη σελίδα

## 🤝 Συνεισφορά

---
## ☕ Support My Work

If you like what I do, consider donating:

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/donate?hosted_button_id=BC8S3RFPLQTHN)

### Development Guidelines
- Χρησιμοποιήστε ελληνικά comments στο code
- Ακολουθήστε τις naming conventions
- Τεστάρετε σε πολλαπλούς browsers
- Διατηρήστε την responsive συμπεριφορά

## 📝 Changelog

### v1.0.0 (2025-07-16)
- ✨ Αρχική έκδοση
- 🎨 Bootstrap 5 integration
- 🔒 Multi-user authentication
- 💾 Backup/Restore functionality
- 📱 Full responsive design
- ⌨️ Keyboard shortcuts
- 🌙 Dark mode support

## 📄 Άδεια Χρήσης

Αυτό το project είναι υπό την άδεια [Lazpal License](LICENSE).

## 📞 Επικοινωνία

Για ερωτήσεις ή υποστήριξη:
- 📧 Email: [pallazarosb@gmail.com](mailto:pallazarosb@gmail.com)
- � Developer: Lazaros Paliamaxidis

---

<div align="center">
  <p>Designed & Developed with ❤️ by <a href="mailto:pallazarosb@gmail.com">Lazaros Paliamaxidis</a></p>
  <p>Φτιαγμένο για τις κατασκηνώσεις Pitsas Camp</p>
  <p><strong>Pitsas Camp Bank © 2025</strong></p>
</div>
