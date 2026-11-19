# -*- coding: utf-8 -*-
#code for email random selection
import random

email_dict = {
                }
gotname = list(email_dict.values())

import win32com.client as win32
from datetime import datetime
import os


def sendmail(receiver_email,name):
    outlook = win32.Dispatch('outlook.application')
    mail = outlook.CreateItem(0)
    print('email to be sent to {email_send}, you got {gotname}'.format(email_send= receiver_email,gotname= name))
    mail.Subject = 'Secret santa poutier mulliez'
    mail.To = receiver_email
    mail.HTMLBody = r"""
        Bonjour, <br> Voila ton tirage pour notre secret santa Poutier-Mulliez, <br>
        si le nom tiré ne s'affiche pas n'hesites pas à me le faire savoir <br>
        Ton tirage: <p style = 'red: Blue; font-size: 20px'> {} </p> <br> Bonne journée ! """.format(name)
    mail.Send() 


for email in email_dict.keys():
    rand_name = random.choice(gotname)
    while rand_name == email_dict.get(email):
        rand_name = random.choice(gotname)
    sendmail(email,rand_name)
    gotname.remove(rand_name)




