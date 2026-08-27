#!/usr/bin/env bash
set -e
python -m pip install -r requirements-test.txt
python -m pytest tests/test_paddy_ai_unit.py -v
