import requests
import pandas as pd
import xlsxwriter
#pipreqs for requirement.txt

def smallest(num1, num2):
    num1 = float(num1)
    num2 = float(num2)
    if num1 == 0:
        return num2
    if num2 == 0:
        return num1
    if num1 != 0 and num2 !=0 :
        if num1 <= num2:
            smallest_num = num1
        else:
            smallest_num = num2
        return smallest_num


def flatBuylowestPrice(location, i):
    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=flat&includeSSTC=false&viewType=LIST&channel=BUY&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
        location, i, i)
    response = requests.get(url_price)
    try:
        lowestPrice_1 = response.text.split('price":{"amount":')[1].split(',"')[0]
    except Exception as e:
        lowestPrice_1 = 0
    try:
        lowestPrice_2 = response.text.split('price":{"amount":')[2].split(',"')[0]
    except Exception as e:
        lowestPrice_2 = 0

    lowestPrice = smallest(lowestPrice_1, lowestPrice_2)
    return lowestPrice

def terracedBuylowestPrice(location, i):
    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=terraced&includeSSTC=false&viewType=LIST&channel=BUY&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
        location, i, i)
    response = requests.get(url_price)
    try:
        lowestPrice_1 = response.text.split('price":{"amount":')[1].split(',"')[0]
    except Exception as e:
        lowestPrice_1 = 0
    try:
        lowestPrice_2 = response.text.split('price":{"amount":')[2].split(',"')[0]
    except Exception as e:
        lowestPrice_2 = 0

    lowestPrice = smallest(lowestPrice_1, lowestPrice_2)
    return lowestPrice

def detachedBuylowestPrice(location, i):
    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=detached&includeSSTC=false&viewType=LIST&channel=BUY&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
        location, i, i)
    response = requests.get(url_price)
    try:
        lowestPrice_1 = response.text.split('price":{"amount":')[1].split(',"')[0]
    except Exception as e:
        lowestPrice_1 = 0
    try:
        lowestPrice_2 = response.text.split('price":{"amount":')[2].split(',"')[0]
    except Exception as e:
        lowestPrice_2 = 0

    lowestPrice = smallest(lowestPrice_1, lowestPrice_2)
    return lowestPrice

def semidetachedBuylowestPrice(location, i):
    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=semi-detached&includeSSTC=false&viewType=LIST&channel=BUY&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
        location, i, i)
    response = requests.get(url_price)
    try:
        lowestPrice_1 = response.text.split('price":{"amount":')[1].split(',"')[0]
    except Exception as e:
        lowestPrice_1 = 0
    try:
        lowestPrice_2 = response.text.split('price":{"amount":')[2].split(',"')[0]
    except Exception as e:
        lowestPrice_2 = 0

    lowestPrice = smallest(lowestPrice_1, lowestPrice_2)
    return lowestPrice

def bungalowBuylowestPrice(location, i):
    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=bungalow&includeSSTC=false&viewType=LIST&channel=BUY&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
        location, i, i)
    response = requests.get(url_price)
    try:
        lowestPrice_1 = response.text.split('price":{"amount":')[1].split(',"')[0]
    except Exception as e:
        lowestPrice_1 = 0
    try:
        lowestPrice_2 = response.text.split('price":{"amount":')[2].split(',"')[0]
    except Exception as e:
        lowestPrice_2 = 0

    lowestPrice = smallest(lowestPrice_1, lowestPrice_2)
    return lowestPrice

def flat(location):
    data = {}
    for i in range(1,5):
        url_letAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=flat&primaryDisplayPropertyType=flats&includeLetAgreed=true&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_letAggreed)
        totalAds_LetAggreed = response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]
        #print(totalAds_LetAggreed)
        url_NotletAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=flat&primaryDisplayPropertyType=flats&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)

        response = requests.get(url_NotletAggreed)
        totalAds_NotLetAggreed= response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        totalLet = int(totalAds_LetAggreed) - int(totalAds_NotLetAggreed)

        if totalAds_LetAggreed != "0":
            percentLet = round(totalLet / int(totalAds_LetAggreed) * 100,2)  # add percent sign while adding into excel file
        else:
            percentLet = 0

        lowestPrice = flatBuylowestPrice(location, i)

        if 0 < int(totalAds_LetAggreed) < 25:

            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=flat&primaryDisplayPropertyType=flats&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, i, i)
            response = requests.get(url_price)

            if totalLet != 0:
                priceList = []
                for j in range(1,26):
                    try:
                        letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                        if letStatus == "Let agreed":
                            price = response.text.split('price":{"amount":')[j].split(',"')[0]
                            priceList.append(int(price))
                    except Exception as e:
                        #print(e)
                        pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        elif int(totalAds_LetAggreed) == 0:
            AveragePrice = 0
            totalLet = 0
            percentLet = 0

        else:
            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=flat&primaryDisplayPropertyType=flats&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, 0, i, i)
            response = requests.get(url_price)

            if totalLet != 0:
                priceList = []
                for num in range(0, int(totalAds_LetAggreed), 24):
                    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=flat&primaryDisplayPropertyType=flats&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(location, num, i, i)
                    response = requests.get(url_price)
                    for j in range(1,26):
                        try:
                            letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                            if letStatus == "Let agreed":
                                price = response.text.split('price":{"amount":')[j].split(',"')[0]
                                priceList.append(int(price))
                                #print(price)
                        except Exception as e:
                            #print(e)
                            pass

                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)

                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0


        data[i] = [float(AveragePrice), int(totalAds_LetAggreed), totalLet, percentLet, float(lowestPrice)]

    return data

def terraced(location):
    data = {}
    for i in range(1,5):
        url_letAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=terraced&secondaryDisplayPropertyType=terracedhouses&includeLetAgreed=true&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_letAggreed)
        totalAds_LetAggreed = response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        url_NotletAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=terraced&secondaryDisplayPropertyType=terracedhouses&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_NotletAggreed)
        totalAds_NotLetAggreed= response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        totalLet = int(totalAds_LetAggreed) - int(totalAds_NotLetAggreed)

        if totalAds_LetAggreed != "0":
            percentLet = round(totalLet / int(totalAds_LetAggreed) * 100,2)  # add percent sign while adding into excel file
        else:
            percentLet = 0

        lowestPrice = terracedBuylowestPrice(location, i)

        if 0 < int(totalAds_LetAggreed) < 25:

            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=terraced&secondaryDisplayPropertyType=terracedhouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, i, i)
            response = requests.get(url_price)

            if totalLet != 0:
                priceList = []
                for j in range(1,25):
                    try:
                        letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                        if letStatus == "Let agreed":
                            price = response.text.split('price":{"amount":')[j].split(',"')[0]
                            priceList.append(int(price))
                            #print(price)
                    except Exception as e:
                        #print(e)
                        pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        elif int(totalAds_LetAggreed) == 0:
            AveragePrice = 0
            totalLet = 0
            percentLet = 0

        else:
            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=terraced&secondaryDisplayPropertyType=terracedhouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, 0, i, i)
            response = requests.get(url_price)
            if totalLet != 0:
                priceList = []
                for num in range(0, int(totalAds_LetAggreed), 24):
                    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=terraced&secondaryDisplayPropertyType=terracedhouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(location, num, i, i)
                    response = requests.get(url_price)

                    for j in range(1,26):
                        try:
                            letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                            if letStatus == "Let agreed":
                                price = response.text.split('price":{"amount":')[j].split(',"')[0]
                                priceList.append(int(price))
                                #print(price)
                        except Exception as e:
                            #print(e)
                            pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        data[i] = [float(AveragePrice), int(totalAds_LetAggreed), totalLet, percentLet, float(lowestPrice)]

    return data

def semidetached(location):
    data = {}
    for i in range(1,5):
        url_letAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=semi-detached&secondaryDisplayPropertyType=semidetachedhouses&includeLetAgreed=true&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_letAggreed)
        totalAds_LetAggreed = response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        url_NotletAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=semi-detached&secondaryDisplayPropertyType=semidetachedhouses&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_NotletAggreed)
        totalAds_NotLetAggreed= response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        totalLet = int(totalAds_LetAggreed) - int(totalAds_NotLetAggreed)

        if totalAds_LetAggreed != "0":
            percentLet = round(totalLet / int(totalAds_LetAggreed) * 100,2)  # add percent sign while adding into excel file
        else:
            percentLet = 0

        lowestPrice = semidetachedBuylowestPrice(location, i)

        if 0 < int(totalAds_LetAggreed) < 25:
            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=semi-detached&secondaryDisplayPropertyType=semidetachedhouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, i, i)
            response = requests.get(url_price)
            if totalLet != 0:
                priceList = []
                for j in range(1,25):
                    try:
                        letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                        if letStatus == "Let agreed":
                            price = response.text.split('price":{"amount":')[j].split(',"')[0]
                            priceList.append(int(price))
                    except Exception as e:
                        pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        elif int(totalAds_LetAggreed) == 0:
            AveragePrice = 0
            totalLet = 0
            percentLet = 0

        else:
            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=semi-detached&secondaryDisplayPropertyType=semidetachedhouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, 0, i, i)
            response = requests.get(url_price)

            if totalLet != 0:
                priceList = []
                for num in range(0, int(totalAds_LetAggreed), 24):
                    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=semi-detached&secondaryDisplayPropertyType=semidetachedhouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(location, num, i, i)
                    response = requests.get(url_price)
                    for j in range(1,26):
                        try:
                            letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                            if letStatus == "Let agreed":
                                price = response.text.split('price":{"amount":')[j].split(',"')[0]
                                priceList.append(int(price))
                                #print(price)
                        except Exception as e:
                            #print(e)
                            pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        data[i] = [float(AveragePrice), int(totalAds_LetAggreed), totalLet, percentLet, float(lowestPrice)]

    return data

def detached(location):
    data = {}
    for i in range(1,5):
        url_letAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=detached&secondaryDisplayPropertyType=detachedshouses&includeLetAgreed=true&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_letAggreed)
        totalAds_LetAggreed = response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        url_NotletAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=detached&secondaryDisplayPropertyType=detachedshouses&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_NotletAggreed)
        totalAds_NotLetAggreed= response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        totalLet = int(totalAds_LetAggreed) - int(totalAds_NotLetAggreed)

        if totalAds_LetAggreed != "0":
            percentLet = round(totalLet / int(totalAds_LetAggreed) * 100,2)  # add percent sign while adding into excel file
        else:
            percentLet = 0

        lowestPrice = detachedBuylowestPrice(location, i)

        if 0 < int(totalAds_LetAggreed) < 25:

            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=detached&secondaryDisplayPropertyType=detachedshouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, i, i)
            response = requests.get(url_price)

            if totalLet != 0:
                priceList = []
                for j in range(1,25):
                    try:
                        letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                        if letStatus == "Let agreed":
                            price = response.text.split('price":{"amount":')[j].split(',"')[0]
                            priceList.append(int(price))
                            #print(price)
                    except Exception as e:
                        #print(e)
                        pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        elif int(totalAds_LetAggreed) == 0:
            AveragePrice = 0
            totalLet = 0
            percentLet = 0

        else:
            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=detached&secondaryDisplayPropertyType=detachedshouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, 0, i, i)
            response = requests.get(url_price)

            if totalLet != 0:
                priceList = []
                for num in range(0, int(totalAds_LetAggreed), 24):
                    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=detached&secondaryDisplayPropertyType=detachedshouses&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(location, num, i, i)
                    response = requests.get(url_price)
                    for j in range(1,26):
                        try:
                            letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                            if letStatus == "Let agreed":
                                price = response.text.split('price":{"amount":')[j].split(',"')[0]
                                priceList.append(int(price))
                                #print(price)
                        except Exception as e:
                            #print(e)
                            pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        data[i] = [float(AveragePrice), int(totalAds_LetAggreed), totalLet, percentLet, float(lowestPrice)]

    return data

def bungalow(location):
    data = {}
    for i in range(1,5):
        url_letAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=bungalow&primaryDisplayPropertyType=bungalows&includeLetAgreed=true&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_letAggreed)
        totalAds_LetAggreed = response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        url_NotletAggreed = 'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier={}&maxBedrooms={}&minBedrooms={}&propertyTypes=bungalow&primaryDisplayPropertyType=bungalows&mustHave=&dontShow=&furnishTypes=&keywords='.format(location, i, i)
        response = requests.get(url_NotletAggreed)
        totalAds_NotLetAggreed= response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0]

        totalLet = int(totalAds_LetAggreed) - int(totalAds_NotLetAggreed)

        if totalAds_LetAggreed != "0":
            percentLet = round(totalLet / int(totalAds_LetAggreed) * 100,2)  # add percent sign while adding into excel file
        else:
            percentLet = 0

        lowestPrice = bungalowBuylowestPrice(location, i)

        if 0 < int(totalAds_LetAggreed) < 25:
            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index=0&propertyTypes=bungalow&primaryDisplayPropertyType=bungalows&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, i, i)
            response = requests.get(url_price)

            if totalLet != 0:

                priceList = []
                for j in range(1,25):
                    try:
                        letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                        if letStatus == "Let agreed":
                            price = response.text.split('price":{"amount":')[j].split(',"')[0]
                            priceList.append(int(price))
                            #print(price)
                    except Exception as e:
                        #print(e)
                        pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        elif int(totalAds_LetAggreed) == 0:
            AveragePrice = 0
            totalLet = 0
            percentLet = 0

        else:
            url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=bungalow&primaryDisplayPropertyType=bungalows&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(
                location, 0, i, i)
            response = requests.get(url_price)

            if totalLet != 0:
                priceList = []
                for num in range(0, int(totalAds_LetAggreed), 24):
                    url_price = "https://www.rightmove.co.uk/api/_search?locationIdentifier={}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&index={}&propertyTypes=bungalow&primaryDisplayPropertyType=bungalows&includeLetAgreed=true&viewType=LIST&channel=RENT&areaSizeUnit=sqft&currencyCode=GBP&isFetching=false&minBedrooms={}&maxBedrooms={}".format(location, num, i, i)
                    response = requests.get(url_price)
                    for j in range(1,26):
                        try:
                            letStatus = response.text.split('"displayStatus":"')[j].split('","')[0]
                            if letStatus == "Let agreed":
                                price = response.text.split('price":{"amount":')[j].split(',"')[0]
                                priceList.append(int(price))
                                #print(price)
                        except Exception as e:
                            #print(e)
                            pass
                if priceList != []:
                    AveragePrice = sum(priceList) / len(priceList)
                else:
                    AveragePrice = 0
            else:
                AveragePrice = 0

        data[i] = [float(AveragePrice), int(totalAds_LetAggreed), totalLet, percentLet, float(lowestPrice)]

    return data

def main():
    print('[#] The tool has been initiated!')
    df = pd.read_csv("rightmove.csv")

    workbook = xlsxwriter.Workbook('output_old.xlsx')
    worksheet = workbook.add_worksheet("output")
    merge_format = workbook.add_format({
        'bold': 1,
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'})

    # Merge 3 cells
    worksheet.merge_range('E1:X1', 'Flat', merge_format)
    worksheet.merge_range('Y1:AR1', 'Terraced', merge_format)
    worksheet.merge_range('AS1:BL1', 'Semi-detached', merge_format)
    worksheet.merge_range('BM1:CF1', 'Detached', merge_format)
    worksheet.merge_range('CG1:CZ1', 'Bungalow', merge_format)

    worksheet.write(1, 0, "Post Code")
    worksheet.write(1, 1, "Total Rentals")
    worksheet.write(1, 2, "Total Let")
    worksheet.write(1, 3, "% Let")

    List = ["1 Average Price",
            "1 Rental",
            "1 Let",
            "1 % Let",
            "1 Lowest Price",
            "2 Average Price",
            "2 Rental",
            "2 Let",
            "2 % Let",
            "2 Lowest Price",
            "3 Average Price",
            "3 Rental",
            "3 Let",
            "3 % Let",
            "3 Lowest Price",
            "4 Average Price",
            "4 Rental",
            "4 Let",
            "4 % Let",
            "4 Lowest Price",]

    for k in range(0,100,20):
        row = 1
        col = 4+k
        for item in List:
            worksheet.write(row, col, item)
            col += 1
    num = 0
    for i in range(0, len(df["Post Code"])):
        try:
            PostCode = df["Post Code"][i]
            city_to_search = "https://www.rightmove.co.uk/property-to-rent/search.html?searchLocation=%s&useLocationIdentifier=false&locationIdentifier=&rent.x=RENT&search=Start+Search" % PostCode
            response = requests.get(city_to_search)

            if "We could not find a place name" not in response.text:

                location = response.text.split('locationIdentifier" type="hidden" value="')[1].split('"')[0]

                url_to_search_LetAggreed = "https://www.rightmove.co.uk/property-to-rent/find.html?searchType=RENT&locationIdentifier={}&insId=1&radius=0.0&minPrice=&maxPrice=&minBedrooms=&maxBedrooms=&displayPropertyType=&maxDaysSinceAdded=&sortByPriceDescending=&includeLetAgreed=true&_includeLetAgreed=on&primaryDisplayPropertyType=&secondaryDisplayPropertyType=&oldDisplayPropertyType=&oldPrimaryDisplayPropertyType=&letType=&letFurnishType=&houseFlatShare=".format(location)
                response = requests.get(url_to_search_LetAggreed)

                if 'Not Found' not in response.text:
                    try:
                        totalAds_LetAggreed= response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0].replace(',','')
                    except Exception as e:
                        totalAds_LetAggreed = \
                        response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[
                            0]

                    if totalAds_LetAggreed != '0':
                        url_to_search_Let = "https://www.rightmove.co.uk/property-to-rent/find.html?searchType=RENT&locationIdentifier={}&insId=1&radius=0.0&minPrice=&maxPrice=&minBedrooms=&maxBedrooms=&displayPropertyType=&maxDaysSinceAdded=&sortByPriceDescending=&_includeLetAgreed=on&primaryDisplayPropertyType=&secondaryDisplayPropertyType=&oldDisplayPropertyType=&oldPrimaryDisplayPropertyType=&letType=&letFurnishType=&houseFlatShare=".format(location)
                        response = requests.get(url_to_search_Let)

                        try:
                            totalAds_Let= response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split('</span>')[0].replace(',','')
                        except Exception as e:
                            totalAds_Let = \
                            response.text.split('"counter: resultCount, formatter: numberFormatter">')[1].split(
                                '</span>')[0]

                        totalLet = int(totalAds_LetAggreed) - int(totalAds_Let)
                        percentLet = round(totalLet/int(totalAds_LetAggreed)*100,2)
                        #print(percentLet)

                        flatData = flat(location)
                        terracedData = terraced(location)
                        semidetachedData = semidetached(location)
                        detachedData = detached(location)
                        bungalowData = bungalow(location)

                    # print(flatData)
                    # print(terracedData)
                    # print(semidetachedData)
                    # print(detachedData)
                    # print(bungalowData)

                        worksheet.write(2 + num, 0, PostCode)
                        worksheet.write(2 + num, 1, int(totalAds_LetAggreed))
                        worksheet.write(2 + num, 2, totalLet)
                        worksheet.write(2 + num, 3, percentLet)

                        #flatData adding
                        row = 2+num
                        col = 4
                        for key in flatData.keys():
                            for item in flatData[key]:
                                worksheet.write(row, col, item)
                                col += 1

                        #terracedData adding
                        row = 2+num
                        col = 4 + 20
                        for key in terracedData.keys():
                            for item in terracedData[key]:
                                worksheet.write(row, col, item)
                                col += 1

                        #semidetachedData adding
                        row = 2+num
                        col = 4 + 40
                        for key in semidetachedData.keys():
                            for item in semidetachedData[key]:
                                worksheet.write(row, col, item)
                                col += 1

                        #detachedData adding
                        row = 2+num
                        col = 4 + 60
                        for key in detachedData.keys():
                            for item in detachedData[key]:
                                worksheet.write(row, col, item)
                                col += 1

                        #bungalowData adding
                        row = 2+num
                        col = 4 + 80
                        for key in bungalowData.keys():
                            for item in bungalowData[key]:
                                worksheet.write(row, col, item)
                                col += 1

                        print('[#] {} postcode is completed!'.format(PostCode))
                        num+=1
                    else:
                        print("[#] {} postcode is not found in the database!".format(PostCode))
                else:
                    print("[#] {} postcode is not found in the database!".format(PostCode))
            else:
                print("[#] {} postcode is not found in the database!".format(PostCode))

        except Exception as e:
            print(e)
            pass
        break
    print('[#] The tool has been finished!')
    workbook.close()

if __name__ == '__main__':
    main()






