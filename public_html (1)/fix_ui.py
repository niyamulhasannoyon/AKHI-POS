import re

with open('pos/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove AI CSS styles
html = re.sub(r'\s*/\*\s*AI Assistant UI Styles\s*\*/[\s\S]*?\.ai-input-area\s*\{[\s\S]*?\}', '', html)

# 2. Remove AI HTML and JS
html = re.sub(r'\s*<!-- AI Assistant Floating Button -->[\s\S]*?<!-- AI Assistant Modal -->[\s\S]*?</div>\s*</div>', '', html)
html = re.sub(r'\s*// AI Chat functionality[\s\S]*?}\);', '', html)

# 3. Fix POS View mobile layout
pos_view_old = '<div id="pos-view" class="main-view hidden h-full flex flex-col md:flex-row">'
pos_view_new = '<div id="pos-view" class="main-view hidden h-full overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">'
html = html.replace(pos_view_old, pos_view_new)

product_section_old = '<section class="flex-1 p-4 md:p-6 flex flex-col h-[50%] md:h-full overflow-hidden order-1">'
product_section_new = '<section class="flex-1 p-4 md:p-6 flex flex-col h-[65vh] md:h-full overflow-hidden order-1 shrink-0">'
html = html.replace(product_section_old, product_section_new)

cart_section_old = '<section\n                class="w-full md:w-96 glass-panel flex flex-col h-[50%] md:h-full z-30 order-2 border-t md:border-t-0 md:border-l border-white/10 shadow-2xl">'
cart_section_new = '<section\n                class="w-full md:w-96 glass-panel flex flex-col min-h-[60vh] md:h-full z-30 order-2 border-t md:border-t-0 md:border-l border-white/10 shadow-2xl shrink-0">'
html = html.replace(cart_section_old, cart_section_new)

with open('pos/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
