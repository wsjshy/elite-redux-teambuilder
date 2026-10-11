# -*- coding: utf-8 -*-
"""恢复 nn_data/axis_lib.json：从 build_tool_data.py 源码提取 AXES + AXIS_TEMPLATES 硬编码字面量，
按数据层 2428-2435 的合并逻辑（每条轴追加 '体系模板' 键）落盘。
背景：nn_data/ 目录丢失（.gitignore 忽略，无法 git 恢复），axis_lib 是纯字面量可无源重建。"""
import ast, json, os

BASE = r'D:\game\elite-redux'
SRC = os.path.join(BASE, 'build_tool_data.py')
OUT = os.path.join(BASE, 'nn_data', 'axis_lib.json')

def extract_assign(source, name):
    tree = ast.parse(source)
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and t.id == name:
                    return ast.literal_eval(node.value)
    return None

src = open(SRC, encoding='utf-8').read()
axes = extract_assign(src, 'AXES')
tpls = extract_assign(src, 'AXIS_TEMPLATES')
assert axes and tpls, 'AXES/AXIS_TEMPLATES 提取失败'

TPL_KEYS = ('体系核心', '打手位', '补盲位', '联防位', '撒钉清钉轮转位', '功能位')
ids = [a['id'] for a in axes]
assert set(tpls) == set(ids), '模板与轴集合不一致: %s' % (set(tpls) ^ set(ids))
for a in axes:
    t = tpls[a['id']]
    assert all(k in t for k in TPL_KEYS) and 'note' in t, '六位/note 不齐: %s' % a['id']
    a['体系模板'] = t  # 数据层 2435 行同款合并

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(json.dumps(axes, ensure_ascii=False, indent=1))
print('axis_lib 恢复: %d 轴 -> %s (%.1f KB)' % (len(axes), OUT, os.path.getsize(OUT) / 1024.0))
print('轴 id:', ids)
