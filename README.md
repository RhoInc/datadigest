# Codebook

The **codebook** package provides a simple interactive framework for exploring data. You can:
- Try it out at the [demo site](https://rhoinc.github.io/viz-library/examples/0009-web-codebook-demo/example.html)
- Run it yourself using the [sample code below](https://github.com/RhoInc/codebook#usage). 
- Read more in the [manuscript](https://phusewiki.org/docs/2018_US%20Connect18/DV%20STREAM/dv12%20final.pdf)
- Get technical details in the [wiki](https://github.com/RhoInc/codebook/wiki) 
- Check out the associated [web-codebook](https://github.com/RhoInc/web-codebook) github repo
- See a screenshot below

![codebook image](https://user-images.githubusercontent.com/14199771/43269882-ccc06a26-90c1-11e8-9026-a91d67a57fcf.png)

## Usage

Installing and using the codebook typically only requires a few lines of code. To summarize a single file: 

```r
devtools::install_github("RhoInc/codebook")
library("codebook")
codebook(data = mtcars)
```

Or to explore all of the data loaded in the current R session: 

```r
devtools::install_github("RhoInc/codebook")
library("codebook")
explorer(data = NULL, addEnv = TRUE)
```
