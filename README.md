
# pack-scraper
webpack sourcemap scraper and extractor
# example ussage
 "npm run cli outDir=example page=http://www.example.com  additionalScripts=http://www.example.com/1.js,http://www.example.com/2.js" .   
 Additional scripts can be i.e lazy loaded js modules in angular routes.  
 To Obtain them open the page you want to analyze and click through all routes.  
 From There on extract JS files from the sources tab of the devTools and pass as a string list to additionalScripts
# for help
=> npm run cli help
![cli help](https://raw.githubusercontent.com/xsip/pack-scraper/master/npmrunclihelp.png)

# Sourcemap Extractor
 The Sourcemap souercecontent extractor itself is heavy inspired by this source . https://github.com/mutoo/webpack-sourcemap-unpacker
