import os
import shutil
import re

# Define the directories
code_dir = "C:\\Users\\lifengren\\Teaching\\APEC1101\\open_principles_of_microeconomics_dev"
doctomd_dir = os.path.join(code_dir, "doctomd")
media_dir = os.path.join(doctomd_dir, "media")
target_dir = os.path.join(code_dir, "open_principles_of_microeconomics")

# Copy the media folder
shutil.copytree(media_dir, os.path.join(target_dir, "media"), dirs_exist_ok=True)
print("Media folder copied.")

# Regular expression patterns for the desired .md files
patterns = [
    re.compile(r"^\d+-\d+-.+\.md$"),  # Number-number-title.md
    re.compile(r"^\d+-introduction-.+\.md$"),  # number-introduction-title.md
    re.compile(r"^1-introduction\.md$")  # Exact match for 1-introduction.md
]

# Copy and rename .md files to .qmd
for filename in os.listdir(doctomd_dir):
    if any(pat.match(filename) for pat in patterns):
        md_file_path = os.path.join(doctomd_dir, filename)
        qmd_file_path = os.path.join(target_dir, os.path.splitext(filename)[0] + ".qmd")
        
        shutil.copy(md_file_path, qmd_file_path)
        print(f"Copied and renamed {filename} to {qmd_file_path}")

print("All specified .md files have been copied and renamed to .qmd.")
