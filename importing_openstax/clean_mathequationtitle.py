import os
import re

# Define the directory containing .qmd files
base_dir = "C:\\Users\\lifengren\\Teaching\\open_principles_of_microeconomics\\open_principles_of_microeconomics_dev"
code_dir = os.path.join(base_dir, "open_principles_of_microeconomics")

# Regular expression to match the markdown image syntax with non-empty alt text
img_regex = re.compile(r'!\[[^\]]+\]\((media\/[^)]+\.png)\)')

# Function to process files
def process_files(directory):
    # Loop through each file in the directory
    for file_name in os.listdir(directory):
        if file_name.endswith('.qmd'):
            # Construct full file path
            file_path = os.path.join(directory, file_name)
            # Read the file content
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

            # Replace the alt text with empty string
            new_content = img_regex.sub(r'![](\1)', content)

            # Write the modified content back to the file
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)

# Call the function to process the files
process_files(code_dir)
