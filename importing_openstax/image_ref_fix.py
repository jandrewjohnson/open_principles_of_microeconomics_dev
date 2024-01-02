import os
import re

# Define the directories
code_dir = "C:\\Users\\lifengren\\Teaching\\open_principles_of_microeconomics\\open_principles_of_microeconomics_dev\\importing_openstax"
doctomd_dir = os.path.join(code_dir, "doctomd")
media_dir = os.path.join(doctomd_dir, "media")

# Function to rename .jpeg files to .png in the media directory
def rename_media_files():
    for filename in os.listdir(media_dir):
        if filename.endswith(".jpeg"):
            base_file_name = os.path.splitext(filename)[0]
            os.rename(os.path.join(media_dir, filename),
                      os.path.join(media_dir, base_file_name + ".png"))

# Function to replace image references in a Markdown file
def replace_image_references(md_file_path, md_base_name):
    with open(md_file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Regex to find image references. This captures any file within the media directory
    image_refs = re.findall(r'\(media\/[^)]+\)', content)

    for ref in image_refs:
        file_name_with_ext = ref.split('/')[1].split(')')[0]  # Extract the file name and extension
        file_name, ext = os.path.splitext(file_name_with_ext)

        # Skip already updated files
        if f'{md_base_name}_' in file_name:
            continue

        # Create new reference with relative path and .png extension, ensuring no double .png
        new_ref = f'(media/{md_base_name}_{file_name}.png)'
        # Replace in content, ensuring the extension is .png
        content = content.replace(ref, new_ref)

    # Write the updated content back to the file
    with open(md_file_path, 'w', encoding='utf-8') as file:
        file.write(content)

# Rename .jpeg files to .png in the media directory
rename_media_files()

# Iterate through .md files in the doctomd directory and update references
for filename in os.listdir(doctomd_dir):
    if filename.endswith(".md"):
        md_file_path = os.path.join(doctomd_dir, filename)
        md_base_name = os.path.splitext(filename)[0]
        replace_image_references(md_file_path, md_base_name)
        print(f"Updated image references in {filename}")

print("All Markdown files have been updated.")
