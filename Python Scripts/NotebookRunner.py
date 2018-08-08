#!/usr/bin/env python3
"""Example of using nbparameterise API to substitute variables in 'batch mode'
"""
import sys
import nbformat
from nbparameterise import extract_parameters, parameter_values, replace_definitions

inital = sys.argv[1] # First argument, most likely is the ipynb file/path
rest = sys.argv[2:] # Rest of the arguments that the ipynb file is expecting
stock_names = rest

with open("display.ipynb") as f:
    nb = nbformat.read(f, as_version=4)

orig_parameters = extract_parameters(nb)

for name in stock_names:
    print("Running for stock", name)

    # Update the parameters and run the notebook
    params = parameter_values(orig_parameters, stock=name)
    new_nb = replace_definitions(nb, params)

    # Save
    with open("display %s.ipynb" % name, 'w') as f:
        nbformat.write(new_nb, f)
