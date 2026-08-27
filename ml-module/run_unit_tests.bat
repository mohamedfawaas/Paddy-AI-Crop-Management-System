@echo off
REM Run this file from the ml-module folder after copying tests/ and pytest.ini there.
python -m pip install -r requirements-test.txt
python -m pytest tests\test_paddy_ai_unit.py -v
pause
