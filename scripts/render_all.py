
import hazelbean as hb 
import os

cwd = os.path.abspath(os.getcwd())
print('Current working directory:', cwd)

book_name = 'open_principles_of_microeconomics'
book_dir = os.path.join('..', book_name)


render_book = 1
if render_book:  
    
    os.chdir(book_dir)
    print('Changed working directory to:', book_name)
 
    always_render = True
    render_prefix = 'HTML_'
    render_dir = os.path.join('..', render_prefix + book_name)
    
    
    hb.create_directories(render_dir)
    
    render_whole_book = False
    if render_whole_book:
        command = "quarto render . "
        print(command)
        os.system(command)
    else:
        qmd_files = hb.list_filtered_paths_recursively('.', include_extensions=['.qmd'])   
        # qmd_files = hb.list_filtered_paths_recursively('.', include_extensions=['.qmd'], exclude_strings=['image_generation'])   
        for qmd_file in qmd_files:
            
            target_path = os.path.join(render_dir, hb.replace_ext(qmd_file, '.html'))
            
            if always_render or not os.path.exists(target_path):
                if hb.path_needs_rerender(qmd_file, target_path):
                    command = "quarto render \"" + qmd_file + "\" --to html"
                    print(command)
                    os.system(command)
            
            # os.system("quarto render .")
        
render_slides = 0
slides_input_dir = '.'
if render_slides:
    paths_to_check_for_slide_content = hb.list_filtered_paths_recursively(slides_input_dir, include_extensions=['.ipynb', '.qmd'], exclude_strings=['_rendered'])
    
    slides_output_dir = '_rendered'
    hb.create_directories(slides_output_dir)
    
    for path in paths_to_check_for_slide_content:
        
        extra_dirs = os.path.split(path)[0]
        src_path = os.path.join(extra_dirs, os.path.split(path)[1])
        
        notebook_copy_path = os.path.join(slides_output_dir, extra_dirs, os.path.split(src_path)[1])
        
        hb.copy(src_path, notebook_copy_path)

        if path.endswith('_slides.ipynb') or path.endswith('_slides.qmd'):            
         
            # UNUSED, but this approach could be used to prepend quarto config info
            # with open(path) as fp:                
                # jsdict = json.load(fp)
                # is_slide = False
                # for line in fp:
                #     if line.startswith('# '):
                #         if line.startswith('#  '):
                #             print('TOGGLE ON', line)
                #             is_slide = True
                #         else:
                #             is_slide = False
                #             print('TOGGLED OFF', line)
                #     # print(line)
                # # print(jsdict['cells']['source'])
                
            command = "quarto render \"" + notebook_copy_path + "\" --to revealjs"
            
            print(command)
            os.system(command)     
            
            # convert_to_pdf_command = "decktape automatic " + hb.replace_ext(notebook_copy_path, '.html') + " " + hb.replace_ext(notebook_copy_path, '.pdf') 
            # print(convert_to_pdf_command)
            # os.system(convert_to_pdf_command) 
            
            
            
            # also do pptx
            command = "quarto render \"" + notebook_copy_path + "\" --to pptx"
            
            print(command)
            os.system(command)  
            
            
            # also do pdf
            command = "quarto render \"" + notebook_copy_path + "\" --to beamer"
            print(command)
            os.system(command)  
            

            
print('Script complete.')
            
