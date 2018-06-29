#' Codebook Explorer Shiny App and RStudio Add-in
#' @import shiny
#' @import htmltools
#' @importFrom Hmisc html describe
#'
#' @export

explorerApp <- function(){
  ui = basicPage(
    includeCSS("./R/www/explorerTheme.css"), 
    helpText("File Controls"),
    fileInput('datafile','Upload file(s)', accept = c('.sas7bdat','.csv'), multiple=TRUE),
    actionButton('clear','Clear file list'),
    explorerOutput("exp_int"),
    suppressDependencies("bootstrap")
  )
  
  server = function(input, output, session){
    
   # wait a second and add a file button
    # Sys.sleep(1)
    # insertUI(
    #   selector="div.explorer div.instructions.section",
    #   where="beforeEnd",
    #   ui=tagList(
    #     fileInput('datafile','Upload file(s)', accept = c('.sas7bdat','.csv'), multiple=TRUE),
    #     actionButton('clear','Clear file list')
    #   )
    # )
    
  
    # initiate reactive values
    dd <- reactiveValues(data=NULL, 
                         addEnv = ifelse(length(ls(pos=1))==0, FALSE, length(ls(pos=1)[sapply(ls(pos=1), function(x) inherits(get(x), "data.frame"))])>0))
     
    observeEvent(input$datafile, {

      dataList <- vector()
      for (i in 1:nrow(input$datafile)){
        if (length(grep(".csv", input$datafile$name[i], ignore.case = TRUE)) > 0){
          dat <- list(data.frame(read.csv(input$datafile$datapath[i], na.strings=NA)))
        }else if(length(grep(".sas7bdat", input$datafile$name[i], ignore.case = TRUE)) > 0){
          dat <- list(data.frame(haven::read_sas(input$datafile$datapath[i])))
        }else{
          dat <- NULL
        }
  
        dataList[i] <- dat
      }
      names(dataList) <- input$datafile$name
      
      dd$data <- c(dataList, dd$data)  
    })
    
    observeEvent(input$clear, {
      dd$data <- NULL
      dd$addEnv <- FALSE   ### we can delete this line if we only want the CLEAR button to remove uploaded files
    })
    
    
    output$exp_int <- renderExplorer({
      if(!is.null(dd$data)){
        explorer(data=dd$data, addEnv=dd$addEnv, demo=FALSE) 
      } else if (is.null(dd$data) & dd$addEnv==TRUE){
        explorer(data=NULL, addEnv = TRUE)
      }else {
        explorer(data=NULL, addEnv=FALSE, demo=T)
      }
    })
    
    
  }
  
  
  runGadget(ui, server, viewer = browserViewer(browser = getOption("browser")))
}
    
