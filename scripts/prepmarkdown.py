import os
import hazelbean as hb
import zipfile
import shutil
import subprocess
import zipfile

# Define the directories
code_dir = "C:\\Users\\lifengren\\Teaching\\priciple_econ\\open_principles_of_microeconomics_dev"  # Replace with the path to your input directory
input_dir = os.path.join(code_dir, "source_texts\\Microeconomics3e_docx")
doctozip_dir = os.path.join(code_dir,"doctozip")
doctomd_dir = os.path.join(code_dir,"doctomd")
media_dir = os.path.join(code_dir,"doctomd\\media")


print(input_dir, doctozip_dir, doctomd_dir, media_dir)

# Create directories if they don't exist
os.makedirs(doctozip_dir, exist_ok=True)
os.makedirs(doctomd_dir, exist_ok=True)
os.makedirs(media_dir, exist_ok=True)

# Copy .docx files to doctomd directory and convert them to Markdown
for filename in os.listdir(input_dir):
    if filename.endswith(".docx"):
        print(f"Processing {filename}...")

        # Copy file to doctomd
        docx_path = os.path.join(input_dir, filename)
        shutil.copy(docx_path, doctomd_dir)
        print(f"Copied {filename} to {doctomd_dir}")

        # Convert .docx to .md using Pandoc
        base_filename = os.path.splitext(filename)[0]
        md_filename = base_filename + '.md'
        pandoc_cmd = f"pandoc \"{os.path.join(doctomd_dir, filename)}\" -f docx -t markdown -o \"{os.path.join(doctomd_dir, md_filename)}\""
        subprocess.run(pandoc_cmd, shell=True)
        print(f"Converted {filename} to Markdown")

        # Delete the original .docx file from doctomd directory
        os.remove(os.path.join(doctomd_dir, filename))
        print(f"Deleted original {filename} from {doctomd_dir}")

        # Change .docx to .zip and unzip
        zip_filename = os.path.join(doctozip_dir, base_filename + ".zip")
        shutil.copy(os.path.join(input_dir, filename), zip_filename)

        with zipfile.ZipFile(zip_filename, 'r') as zip_ref:
            extract_folder = os.path.join(doctozip_dir, base_filename)
            zip_ref.extractall(extract_folder)
            print(f"Unzipped {filename}")

            # Check for media folder and copy contents to media directory
            media_folder = os.path.join(extract_folder, 'word', 'media')
            if os.path.exists(media_folder):
                # Rename and copy media files to avoid conflicts
                for media_file in os.listdir(media_folder):
                    original_path = os.path.join(media_folder, media_file)
                    new_filename = base_filename + "_" + media_file
                    new_path = os.path.join(media_dir, new_filename)

                    # Check if the file already exists, and if it does, append a counter to its name
                    counter = 1
                    while os.path.exists(new_path):
                        new_filename = f"{base_filename}_{counter}_{media_file}"
                        new_path = os.path.join(media_dir, new_filename)
                        counter += 1

                    shutil.copy(original_path, new_path)
                print(f"Copied media files for {filename}")

        print(f"Finished processing {filename}")

# Delete the doctozip directory
shutil.rmtree(doctozip_dir)
print("doctozip directory deleted")

print("All conversions and extractions completed.")