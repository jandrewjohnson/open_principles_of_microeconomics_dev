import os
import re
from collections import defaultdict

# Define the directory containing .qmd files
code_dir = "C:/Users/lifengren/Teaching/priciple_econ/open_principles_of_microeconomics_dev/open_principles_of_microeconomics"  # Replace with your actual directory

# Function to downgrade headings in a .qmd file content
def downgrade_headings(content):
    return re.sub(r'^(#+)(\s.*)', lambda match: '#' + match.group(1) + match.group(2), content, flags=re.MULTILINE)

# Function to sort and combine qmd files for each chapter
def combine_chapter_files(chapter_files, chapter_num):
    combined_content = ""
    for file_name in sorted(chapter_files):  # Sort files to maintain order
        file_path = os.path.join(code_dir, file_name)
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            content = downgrade_headings(content)
            combined_content += content + "\n\n"
    
    combined_file_path = os.path.join(code_dir, f"chapter{chapter_num}.qmd")
    with open(combined_file_path, 'w', encoding='utf-8') as file:
        file.write(combined_content)
    print(f"Combined chapter {chapter_num} file created at {combined_file_path}")

# Collect and group files by chapter
chapter_files = defaultdict(list)
for filename in os.listdir(code_dir):
    if filename.endswith(".qmd"):
        match = re.match(r"(\d+)-.*\.qmd$", filename)
        if match:
            chapter_num = match.group(1)
            chapter_files[chapter_num].append(filename)

# Combine files for each detected chapter
for chapter_num, files in chapter_files.items():
    combine_chapter_files(files, chapter_num)
