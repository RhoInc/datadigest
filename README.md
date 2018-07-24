# Codebook

## Create Rho's interactive codebook from R.

### Codebook is an R package built using the htmlwidgets framework.  Codebook provides an R interface for Rho's **web-codebook** Javascript widget. The underlying tool is built using Webcharts and d3.js. Using this tool, the user can view and explore summary information about their dataset.  The R interface allows the analyst to interactively explore data within their typical workflow and working evironment. 

### Installation:

```r
devtools::install_github('RhoInc/codebook')
```

### Use

1. Produce an interactive codebook to explore in the browser or an Rmarkdown or HTML document:
```r
codebook(mtcars)
```

2. Run the codebook Shiny app*, which will produce a codebook from data from your R environment or a file upload.  Decide on a format (interactive summary vs. static summary from **Hmisc::describe**) and download the codebook as an HTML file. 
```r
codebookApp()
```

3. Generate the interactive codebook explorer to explore multiple data files in the browser or an Rmarkdown or HTML document:
```r
explorer(list(mtcars, iris))
```

4. Run the explorer Shiny app*, which will produce the codebook explorer.  If available, data from the R session will be used.  Otherwise, a set of example datasets will populate the explorer.  The user may also upload one or more files to the application.
```r
explorerApp()
```

*If you use RStudio, this app will be available to you as an RStudio addin upon package installation. You can access the addin from the RStudio toolbar.

Please see the [wiki](https://github.com/RhoInc/codebook/wiki) for more information about the **codebook** package.
