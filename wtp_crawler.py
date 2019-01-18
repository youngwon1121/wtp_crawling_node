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

def calc_rank(rank_arr):
	final_rank = 0
	if rank_arr == [11, 11, 11, 11, 11, 11, 11, 11, 11, 11]:
		return final_rank
	for rank in rank_arr:
		if rank == 11:
			final_rank += 10
		else : 
			final_rank += rank
			break
	return final_rank

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

def main_processing(func, link_arr, start_idx):
	end_idx = start_idx+3
	if start_idx == 6:
		end_idx = 10
	links = link_arr[start_idx:end_idx]
	pool = Pool(processes=3)
	rank = pool.map(func, links)
	pool.close()
	pool.join()
	return rank
'''
	searching_type :
		1 blog
		2 cafe
		3 kin
'''	
if __name__ == '__main__':
	start_time = time.time()
	
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
	#func는 target_url, rank=1, wrap_name을 이미 맵핑해놓은 함수임
	func = partial(get_rank, target_url, rank, wrap_name)
	links = get_links(keyword, searching_type)

	#rank_arr이 main_processing의 반환값
	rank_arr = []
	idx=0
	while 1:
		if idx == 6:
			#마지막 프로세스에 프로세스 4개배정
			rank_arr[idx:idx+4] = main_processing(func, links, idx)
			break
		else:
			rank_arr[idx:idx+3] = main_processing(func, links, idx)
			#이미 찾은경우
			if rank_arr[idx:idx+3] != [11, 11, 11]:
				break
			idx += 3

	print(calc_rank(rank_arr))