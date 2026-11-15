# -*- coding: utf-8 -*-
import io
P=r'D:\game\elite-redux\README.md'
t=io.open(P,encoding='utf-8',newline='').read()
anchor="![超级黑鲁加 晴增伤清场答案卡](docs/shots/v4378_houndoom_fix.png)\n"
assert t.count(anchor)==1
bullet=(
"- **速攻手不手动开天气/场地，队伍级辅助交给队友**。有玩家指出：黑鲁加是玻璃大炮，回合金贵，没有多余回合手动开晴天；没有队友给它开，它宁愿不带这个体系。这是队伍级的配队思维，本版举一反三覆盖全部速攻手——天气/场地这类队伍级辅助由队友提供，没有队友就不依赖，而不是自己花回合开。工具会自动把手动天气/场地招换成补盲攻击招、把残留的晴免蓄力招（日光束/日光刃）换掉、把依赖天气的特性换成常驻特性（如黑鲁加换「燃烧」，火招常驻×1.5），并去掉流派名里的天气前缀；恶作剧之心和自身特性自动开天气为例外。全库 40 条速攻流派收口，换出常驻特性 25 条，带常驻效果的特性（如沙之守卫反先制、北风入场极光幕）不会误删。\n"
"\n"
"![超级黑鲁加 不再手动开晴天答案卡](docs/shots/v4379_houndoom_no_weather.png)\n"
)
t=t.replace(anchor, anchor+bullet, 1)
io.open(P,'w',encoding='utf-8',newline='').write(t)
print('updated, CRLF',t.count('\r\n'),'bareLF',t.count('\n')-t.count('\r\n'))
