# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['C:\\Users\\marky\\flask_app\\app.py'],
    pathex=[],
    binaries=[],
    datas=[('C:\\Users\\marky\\flask_app\\client_secret.json', '.'), ('C:\\Users\\marky\\flask_app\\fetch.py', '.'), ('C:\\Users\\marky\\flask_app\\location.py', '.'), ('C:\\Users\\marky\\flask_app\\static', 'static/'), ('C:\\Users\\marky\\flask_app\\templates', 'templates/')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['C:\\Users\\marky\\flask_app\\static\\assets\\logo.ico'],
)
