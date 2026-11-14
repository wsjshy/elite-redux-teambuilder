p = r"D:\game\elite-redux\package.json"
d = open(p, "rb").read()
print("CRLF", d.count(b"\r\n"), "LF", d.count(b"\n"))
old = b'"version": "4.376.0"'
new = b'"version": "4.377.0"'
assert d.count(old) == 1
d = d.replace(old, new)
open(p, "wb").write(d)
print("bumped")
