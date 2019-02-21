from bs4 import BeautifulSoup
import datetime
from requests import get
from urllib.parse import urlparse
import re
import sys

def shortCmtCrawler(comment_list):
    for cmt in comment_list.findAll("li", recursive=False):
        reply = ""
        if 're' in cmt.get('class'):
            reply="--reply--"
        comment = cmt.select_one('div.lst_wp > p.txt').text.strip()
        date = cmt.select_one('div.lst_wp > div.date_area > span.date').text.strip()
        print(reply, comment, date)
    return True

def makeMoUrl(url):
    parsed = urlparse(url)
    replaced = parsed._replace(netloc="m."+str(parsed.netloc))
    return replaced.geturl()

def main():
    url = makeMoUrl(sys.argv[1])
    html = get(url)
    soup = BeautifulSoup(html.content, 'html.parser')
    try:
        cmt_list = soup.find('div', {"class" : "section_comment"}).ul
        #check existing of comment nav
        full_cmt= soup.select_one('.section_comment_btn > .nav_comment')
        if full_cmt is None:
            shortCmtCrawler(cmt_list)
            return True

        aa = full_cmt.a.get('class')
        for i in aa:
            regex = re.compile('^_click.*')
            m = regex.match(i)
            if m is not None:
                full_cmt_url = url + i.split('|')[2]
                break
        html = get(full_cmt_url)
        soup = BeautifulSoup(html.content, 'html.parser')
        cmt_list = soup.select('ul.u_cbox_list > li.u_cbox_comment')
        for cmt in cmt_list:
            reply = ""
            if 're' in cmt.get('class'):
                reply="--reply--"
            area = cmt.select_one('.u_cbox_comment_box > .u_cbox_area')
            try : 
                content = area.select_one('.u_cbox_text_wrap > span.u_cbox_contents').text
                date = area.select_one('.u_cbox_info_base > span').text
                print(reply, content, date)
            except AttributeError:
                date = area.select_one('.u_cbox_info_base > span').text
                print(reply, 'NOT TEXT', date)

    except AttributeError:
        print('error')

if __name__ == '__main__':
    main()