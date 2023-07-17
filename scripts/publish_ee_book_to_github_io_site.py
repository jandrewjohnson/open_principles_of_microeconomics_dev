import hazelbean as hb 
import os



src_dir = 'RENDERED_open_principles_of_microeconomics'
dst_dir = '../../../../Website/jandrewjohnson.github.io/open_principles_of_microeconomics'

print(os.path.abspath(src_dir))
print(os.path.abspath(dst_dir))

hb.copy_file_tree_to_new_root(src_dir, dst_dir)
