# -*- coding: utf-8 -*-
import io,subprocess
P=r'D:\game\elite-redux\index.html'
t=io.open(P,encoding='utf-8',newline='').read()
# 找所有bareLF位置（前面不是CR）
pos=[]
for i,ch in enumerate(t):
    if ch=='\n' and (i==0 or t[i-1]!='\r'):
        pos.append(i)
# 用git取v4.378版本的bareLF
old=subprocess.run([r'D:\Git\bin\git.exe','-C',r'D:\game\elite-redux','show','HEAD:index.html'],capture_output=True).stdout
oldtxt=old.decode('utf-8')
oldpos=[]
for i,ch in enumerate(oldtxt):
    if ch=='\n' and (i==0 or oldtxt[i-1]!='\r'):
        oldpos.append(i)
print('current bareLF',len(pos),'old',len(oldpos))
# 显示当前每个bareLF附近文本
for p in pos:
    print('---',repr(t[max(0,p-40):p+1]))
