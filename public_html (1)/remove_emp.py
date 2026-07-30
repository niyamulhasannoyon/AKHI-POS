import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove the user view nav link
text = re.sub(r'<!-- User -->\s*<a href="#" data-view="user-view"[\s\S]*?</a>', '', text)

# 2. Remove the user-view div completely
text = re.sub(r'<!-- User View \(HR & Payroll\) -->\s*<div id="user-view"[\s\S]*?(?=<!-- Filemanager View -->)', '', text)

# 3. Remove modals related to employees
# Add Employee Modal
text = re.sub(r'<!-- Dark Add Employee Modal -->\s*<div id="add-employee-modal"[\s\S]*?</div>\s*</div>(?=\s*<!-- Dark Edit Employee Modal -->)', '', text)

# Edit Employee Modal
text = re.sub(r'<!-- Dark Edit Employee Modal -->\s*<div id="edit-employee-modal"[\s\S]*?</div>\s*</div>(?=\s*<!-- Dark Employee Profile Modal -->)', '', text)

# Employee Profile Modal
text = re.sub(r'<!-- Dark Employee Profile Modal -->\s*<div id="employee-profile-modal"[\s\S]*?</div>\s*</div>\s*(?=</main>)', '', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
