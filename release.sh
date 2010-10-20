#!/bin/bash
tar cf redmine.wdgt.tar redmine.wdgt
scp redmine.wdgt.tar 4pcbr@4pcbr.com:/var/www/4pcbr.com/redmine/
git push origin master

