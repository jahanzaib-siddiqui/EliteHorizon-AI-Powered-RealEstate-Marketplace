import re
with open('train.py', 'r') as f:
    text = f.read()

# Fix broken print statements containing bare newlines
text = re.sub(r'print\("\n', r'print("\\n"', text)
text = re.sub(r'print\(f"\n', r'print(f"\\n', text)
text = re.sub(r'print\("\n"', r'print("\\n"', text)
text = text.replace('"\n" + "="*60)', '"\\n" + "="*60)')

with open('train.py', 'w') as f:
    f.write(text)
