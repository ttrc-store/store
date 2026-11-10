import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import json
import csv
import os

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    xlsx_json = os.path.join(root_dir, 'data', 'ttrc_india_seo_keywords_3834.json')
    csv_path = os.path.join(root_dir, 'data', 'ttrc_store_india_keyword_research_500_plus.csv')
    output_xlsx = os.path.join(root_dir, 'public', 'TTRC_India_SEO_Keywords.xlsx')
    output_master_json = os.path.join(root_dir, 'data', 'ttrc_india_seo_keywords_master.json')

    # Load initial curated XLSX keywords
    with open(xlsx_json, 'r', encoding='utf-8') as f:
        xlsx_kws = json.load(f)

    CLUSTER_TO_CAT = {
        'Competition robotics': 'Competition Robots',
        'Robotics kits': 'Competition Robots',
        'Motors and motion': 'Motors & Drivers',
        'Motor drivers and control': 'Motors & Drivers',
        'Sensors': 'Sensors',
        'Displays and indicators': 'Sensors',
        'Power and batteries': 'Batteries & Power',
        'Power electronics': 'Batteries & Power',
        'Drone and automation': 'Drones',
        'Electronic components': 'Fasteners & Hardware',
        'Robotics mechanical parts': 'Fasteners & Hardware',
        'Switches and input devices': 'Fasteners & Hardware',
        'Tools and accessories': 'Tools',
        'Arduino boards and kits': 'Microcontrollers & Boards',
        'ESP32 and development boards': 'Microcontrollers & Boards',
        'Boards and controllers': 'Microcontrollers & Boards',
        'Embedded and prototyping': 'Microcontrollers & Boards',
        'Wireless and IoT': 'Wires & Connectors',
        'Communication and identification': 'Wires & Connectors',
        'STEM and education': 'STEM & Education',
        'Electronics learning and lab': 'STEM & Education',
        'Institutional and bulk orders': 'STEM & Education',
        'Projects and use cases': 'Events & How-To',
        'India and regional': 'Regional & Hinglish',
        'Diwali and festive offers': 'Brand & Store',
    }

    def map_csv_intent(kw, csv_intent, cluster):
        k = kw.lower().strip()
        if any(b in k for b in ['ttrc', 'tamizh tech', 'veera', 'theera']):
            return 'Brand'
        if any(p in k for p in ['amazon', 'flipkart', 'meesho', 'indiamart', 'robu', 'robocraze', 'thinkrobotics', 'evelta', 'jiomart']):
            return 'Comparison'
        if any(loc in k for loc in ['bangalore', 'chennai', 'coimbatore', 'delhi', 'mumbai', 'hyderabad', 'kolkata', 'pune', 'tamil nadu', 'kerala', 'karnataka']):
            return 'Local'
        if any(q in k for q in ['how to', 'what is', 'guide', 'tutorial', 'rules', 'pid', 'tuning', 'difference between', 'why', 'pinout']):
            return 'Informational'
        if any(t in k for t in ['buy', 'price', 'cost', 'online', 'wholesale', 'bulk', 'order', 'shop', 'supplier', 'dealer', 'near me', 'store']):
            return 'Transactional'
        if len(k.split()) <= 2:
            return 'Head term'
        return 'Commercial'

    seen = set()
    merged = []

    for k in xlsx_kws:
        norm = k['normalizedKeyword']
        if norm not in seen:
            seen.add(norm)
            merged.append({
                'keyword': k['keyword'],
                'category': k['category'],
                'intent': k['intent'],
                'normalizedKeyword': norm,
                'source': 'curated_seed'
            })

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if len(row) >= 2 and row[1].strip():
                kw = row[1].strip()
                norm = kw.lower()
                if norm not in seen:
                    seen.add(norm)
                    cluster = row[2].strip() if len(row) > 2 else 'STEM and education'
                    csv_intent = row[3].strip() if len(row) > 3 else ''
                    category = CLUSTER_TO_CAT.get(cluster, 'STEM & Education')
                    intent = map_csv_intent(kw, csv_intent, cluster)
                    merged.append({
                        'keyword': kw,
                        'category': category,
                        'intent': intent,
                        'normalizedKeyword': norm,
                        'source': 'store_research_csv'
                    })

    print(f'Total combined unique keywords: {len(merged)}')

    wb = openpyxl.Workbook()

    # Sheet 1: Read Me
    ws_readme = wb.active
    ws_readme.title = 'Read Me'
    readme_lines = [
        ['Notes'],
        ['Master Keyword Intelligence Database for ttrc.store (Robotics, Electronics & STEM — India).'],
        [f'Total Unique Keywords: {len(merged):,} covering Storefront, Marketplaces (Amazon, Flipkart, IndiaMART, Meesho), Local & Content Channels.'],
        ['No search-volume data included: validate in Google Keyword Planner / Google Search Console before prioritizing campaigns.'],
        ['Your Store: Use Head terms + Transactional keywords in product titles, category headings, and meta descriptions.'],
        ['Amazon & Flipkart: Put top 5-8 terms in title/bullet points, and remaining space-separated terms in backend search terms (~250 bytes limit on Amazon).'],
        ['IndiaMART: Use wholesale, bulk, supplier, dealer, and school/lab institution keywords.'],
        ['Google Business Profile: Use local city/state terms (Coimbatore, Chennai, Bangalore, Tamil Nadu, etc.).'],
        ['Blog, YouTube & AEO: Use informational keywords (PID tuning, Line Follower rules, techfest guides, robotics project tutorials).'],
        ['Competitor & Platform: Use comparison keywords comparing TTRC with Amazon India, Flipkart, Robu, Robocraze, ThinkRobotics, etc.'],
    ]
    for row in readme_lines:
        ws_readme.append(row)
    ws_readme['A1'].font = Font(name='Arial', size=11, bold=True)
    ws_readme.column_dimensions['A'].width = 135

    header_font = Font(name='Arial', size=10, bold=True, color='00FFFFFF')
    header_fill = PatternFill(start_color='001F3864', end_color='001F3864', fill_type='solid')

    def format_table_sheet(ws, title, rows_data):
        ws.title = title
        ws.append(['#', 'Keyword', 'Category', 'Search Intent'])
        
        for c_idx in range(1, 5):
            cell = ws.cell(row=1, column=c_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center' if c_idx in [1, 4] else 'left', vertical='center')
        
        for i, r in enumerate(rows_data, start=1):
            ws.append([i, r['keyword'], r['category'], r['intent']])
            ws.cell(row=i+1, column=1).alignment = Alignment(horizontal='center')
            ws.cell(row=i+1, column=4).alignment = Alignment(horizontal='center')
        
        ws.column_dimensions['A'].width = 7.0
        ws.column_dimensions['B'].width = 58.0
        ws.column_dimensions['C'].width = 26.0
        ws.column_dimensions['D'].width = 18.0
        
        max_row = len(rows_data) + 1
        ws.auto_filter.ref = f'A1:D{max_row}'
        ws.freeze_panes = 'A2'

    # Sheet 2: All Keywords
    ws_all = wb.create_sheet('All Keywords')
    format_table_sheet(ws_all, 'All Keywords', merged)

    SHEET_MAP = [
        ('Batteries & Power', 'Batteries-Power'),
        ('Brand & Store', 'Brand-Store'),
        ('Competition Robots', 'Competition Robots'),
        ('Drones', 'Drones'),
        ('Events & How-To', 'Events-How-To'),
        ('Fasteners & Hardware', 'Fasteners-Hardware'),
        ('Microcontrollers & Boards', 'Microcontrollers-Boards'),
        ('Motors & Drivers', 'Motors-Drivers'),
        ('Platform Search', 'Platform Search'),
        ('Regional & Hinglish', 'Regional-Hinglish'),
        ('STEM & Education', 'STEM-Education'),
        ('Sensors', 'Sensors'),
        ('Tools', 'Tools'),
        ('Wires & Connectors', 'Wires-Connectors'),
    ]

    for cat_name, sheet_name in SHEET_MAP:
        cat_rows = [r for r in merged if r['category'] == cat_name]
        ws_cat = wb.create_sheet(sheet_name)
        format_table_sheet(ws_cat, sheet_name, cat_rows)
        print(f'Sheet "{sheet_name}": {len(cat_rows)} rows')

    wb.save(output_xlsx)
    print(f'Successfully updated master Excel at: {output_xlsx}')

    # Save to master JSON
    with open(output_master_json, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    print(f'Successfully saved master JSON at: {output_master_json}')

if __name__ == '__main__':
    main()
