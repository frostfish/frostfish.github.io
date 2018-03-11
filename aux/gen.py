#!/usr/bin/env python3
from jinja2 import Environment, FileSystemLoader
import os
import json

# Capture our current directory
THIS_DIR = os.path.dirname(os.path.abspath(__file__))


def gen(config):
    j2_env = Environment(
        loader=FileSystemLoader(THIS_DIR),
        trim_blocks=True
    )
    template = j2_env.get_template('card.tmpl')

    for data in config:
        print(template.render(data=data))

if __name__ == '__main__':
    with open('config.json') as fin:
        config = json.load(fin)
        gen(config)
