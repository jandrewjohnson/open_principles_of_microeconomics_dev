# This is the script to fix the images in all the .md file.

import os
import re

# Define the directories
code_dir = "C:/Users/lifengren/Teaching/priciple_econ/open_principles_of_microeconomics_dev/importing_openstax"
doctomd_dir = os.path.join(code_dir, "doctomd")

# Function to replace image references in a Markdown file
def replace_image_references(md_file_path, md_base_name):
    with open(md_file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Regex to find image references
    image_refs = re.findall(r'!\[\]\(media\/rId\d+\.jpeg\)', content)

    for ref in image_refs:
        # Extract the rId part
        rId = ref.split('/')[1].split(')')[0]
        # Create new reference with relative path
        new_ref = f'![](media/{md_base_name}_{rId})'
        # Replace in content
        content = content.replace(ref, new_ref)

    # Write the updated content back to the file
    with open(md_file_path, 'w', encoding='utf-8') as file:
        file.write(content)

# Iterate through .md files in the doctomd directory
for filename in os.listdir(doctomd_dir):
    if filename.endswith(".md"):
        md_file_path = os.path.join(doctomd_dir, filename)
        md_base_name = os.path.splitext(filename)[0]
        replace_image_references(md_file_path, md_base_name)
        print(f"Updated image references in {filename}")

print("All Markdown files have been updated.")
