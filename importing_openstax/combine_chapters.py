import os
import re
from collections import defaultdict

# Define the directory containing .qmd files
base_dir = "C:\\Users\\lifengren\\Teaching\\open_principles_of_microeconomics\\open_principles_of_microeconomics_dev"
code_dir = os.path.join(base_dir, "open_principles_of_microeconomics")

# Function to downgrade headings in a .qmd file content
def downgrade_headings(content):
    return re.sub(r'^(#+)(\s.*)', lambda match: '#' + match.group(1) + match.group(2), content, flags=re.MULTILINE)

# Custom sort function to handle chapter sorting including 'introduction'
def chapter_sort_key(file_name):
    parts = file_name.split("-")
    chapter_num = int(parts[0])
    if 'introduction' in parts[1].lower():  # Check if 'introduction' is part of the section name
        section_num = 0  # Assign 0 to introduction so it comes first
    else:
        section_num = int(parts[1].split('.')[0])  # Extract the section number
    return (chapter_num, section_num)  # Return a tuple for sorting

# Function to sort and combine qmd files for each chapter
def combine_chapter_files(chapter_files, chapter_num):
    combined_content = ""
    for file_name in sorted(chapter_files, key=chapter_sort_key):  # Sort files using the custom sort function
        file_path = os.path.join(code_dir, file_name)
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            content = downgrade_headings(content)
            combined_content += content + "\n\n"
        
        # Delete the original .qmd file
        os.remove(file_path)
        print(f"Deleted {file_path}")

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
