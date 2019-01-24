from bs4 import BeautifulSoup
from multiprocessing import Pool
from functools import partial
from urllib import parse
import requests
import sys
import time

def fix_kin_url(kin_url):
	url = parse.urlparse(kin_url)
	query = url.query.split('&')
	query_obj = {}
	for qry in query:
		splited = qry.split('=')
		query_obj[splited[0]] = splited[1]
	base_url = url.netloc + url.path + "?d1id="+ query_obj['d1id'] + "&dirId=" + query_obj['dirId'] + "&docId=" + query_obj['docId']
	return base_url

def calc_rank(rank_arr, base = 0):
	rank = base
	if rank_arr == [11, 11, 11, 11, 11] and base == 50:
		rank = 0
		return rank

	for i in rank_arr:
		if i == 11:
			rank += 10
		else:
			rank += i
			break
	return rank

def get_links(keyword, searching_type):
	links = []

	base_url = "https://search.naver.com/search.naver?where="
	
	if searching_type == "1":
		base_url += "post"

	elif searching_type == "2":
		base_url += "article"

	elif searching_type == "3":
		base_url += "kin"


	base_url += "&query="
	base_url += keyword

	if(searching_type == "3"):
		base_url += "&kin_start="
	else:
		base_url += "&start="
	
	for url_start in range(1, 92, 10):
		links.append(base_url+str(url_start))
	
	return links


def get_rank(target_url, rank, wrap_name, url):
	try:
		r = requests.get(url)
		r.raise_for_status()

	except requests.exceptions.HTTPError as e:
		print(e)
		sys.exit(1)

	except requests.exceptions.RequestException as e:
		print(e)
		sys.exit(1)
	
	soup = BeautifulSoup(r.content, 'html.parser')
	
	wrap = soup.find("div", {"class" : wrap_name}).ul
	top_lists = wrap.find_all("li");
	for top_list in top_lists:
		article = top_list.dl.dt.a['href']

		if wrap_name == "_kinBase":
			article = fix_kin_url(article)

		if target_url == article:
			break

		rank+=1
	return rank

'''
	searching_type :
		1 blog
		2 cafe
		3 kin
'''	
if __name__ == '__main__':
	start_time = time.time()
	
	'''
	keyword = "불량식품"
	target_url = "kin.naver.com/qna/detail.nhn?d1id=13&dirId=130504&docId=195806488"
	searching_type = "3"
	'''
	keyword = sys.argv[1]
	target_url = sys.argv[2]
	searching_type = sys.argv[3]

	if searching_type == "1":
		wrap_name = "_blogBase"
	elif searching_type == "2":
		wrap_name = "_cafeBase"
	elif searching_type == "3":
		wrap_name = "_kinBase"

	rank = 1
	func = partial(get_rank, target_url, rank, wrap_name)
	
	links = get_links(keyword, searching_type)
	links1 = links[:5]
	links2 = links[5:10]

	pool = Pool(processes=4)
	rank1 = pool.map(func, links1)
	pool.close()
	pool.join()

	#first try
	if [11, 11, 11, 11, 11] != rank1:
		#terminating when found in first try
		#print(rank1)
		print(calc_rank(rank1))
		print("%s" %(time.time()-start_time))
	else:
		#second try
		pool = Pool(processes=6)
		rank2 = pool.map(func, links2)
		pool.close()
		pool.join()

		#print(rank2)
		print(calc_rank(rank2, 50))
		print("%s" %(time.time()-start_time))