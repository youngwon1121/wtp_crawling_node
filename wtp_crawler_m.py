from bs4 import BeautifulSoup
import requests
import sys
import time

def get_links(keyword):
	base_url = "https://m.search.naver.com/search.naver?where=m_view"
	base_url += "&query="
	base_url += keyword
	return base_url

def get_rank(url, target_url):
	rank = 1
	headers = {'User-Agent': 'Mozilla/5.0'}
	r = requests.get(url, headers=headers)
	soup = BeautifulSoup(r.content, 'html.parser')
	top_lists = soup.findAll("li", {"class" : "_item"})

	#requests err handling when occurs 403 err
	if not top_lists:
		rank = 101
		return rank 

	for top_list in top_lists:
		article = top_list.find("div", {"class" : "total_wrap"}).find("a", {"class" : "api_txt_lines"})['href']
		if article == target_url:
			break
		rank += 1

	if rank == 16:
		rank = 0
	return rank

if __name__ == "__main__":
	
	keyword = sys.argv[1]
	target_url = sys.argv[2]

	links = get_links(keyword)
	rank = get_rank(links, target_url)
	print(rank)