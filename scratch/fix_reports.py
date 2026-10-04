path = 'backend/src/main/java/com/smartwashpro/service/ReportService.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = '.replace(/_/g, " ")'
replacement = '.replace("_", " ")'
new_text = text.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Success. Target occurrences remaining:', new_text.count(target))
