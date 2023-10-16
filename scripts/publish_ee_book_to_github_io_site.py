import hazelbean as hb 
import os


code_dir = 'open_principles_of_microeconomics'
src_dir = 'RENDERED_open_principles_of_microeconomics'
dst_dir = '../../Website/jandrewjohnson.github.io/open_principles_of_microeconomics'

print(os.path.abspath(src_dir))
print(os.path.abspath(dst_dir))

hb.copy_file_tree_to_new_root(src_dir, dst_dir)

# Aso copy the images

src_dir = os.path.join(code_dir, 'images')
dst_dir = os.path.join(dst_dir, 'images')
hb.copy_file_tree_to_new_root(src_dir, dst_dir)
