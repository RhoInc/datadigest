#' Codebook Shiny App and RStudio Add-in
#' @import shiny
#' @import htmltools
#' @importFrom haven read_sas
#' @importFrom utils read.csv
#' @importFrom Hmisc html describe
#' @importFrom tools file_path_sans_ext
#' 
#' @export
codebookApp <- function(){
  
  ui <- fluidPage(
    
    titlePanel("Codebook Shiny App"), 
    sidebarLayout(
      sidebarPanel(
        width = 3,
        selectInput("data", NULL, choices=c("Select a dataset", "Data upload")),
        conditionalPanel(
          condition = "input.data=='Data upload'",
          fileInput('datafile','Upload a file',accept = c('.sas7bdat','.csv'))
        ),
        selectInput("type","Select codebook type", choices=c("Interactive","Static")), 
        downloadButton("dl","Download codebook")
      ),
      mainPanel(
        conditionalPanel(
          condition = "input.type=='Interactive'",
          codebookOutput("cbk_int")
        ),
        conditionalPanel(
          condition = "input.type=='Static'",
          uiOutput("cbk_sta")
        )
      ) 
    )
  )
  
  
  server <- function(input, output, session){
    
    
    # find all loaded datasets
    df <- reactiveValues(names = ls(pos=1)[sapply(ls(pos=1), function(x) class(get(x))) == 'data.frame'])
    
    # fill in select input based on datasets
    observeEvent(!is.null(df$names), {
      names <- c("Select a dataset", df$names, "Data upload")
      updateSelectInput(session, "data",choices = names)
    })
    
    datafile <- reactive({
      
      if(is.null(input$datafile)){
        return(NULL)
      }else{
        input$datafile
      }
    })

    
    data_choice <- reactive({
      
      validate(
        need(! is.null(datafile()) | ! input$data %in% c("Select a dataset", "Data upload"),'')
      ) 
      
      if(input$data=="Select a dataset"){
        return(NULL)
      } else if (! input$data %in% c("Select a dataset", "Data upload")){
        return(get(input$data))
      } else if (input$data=="Data upload" & !is.null(datafile())){
        if (length(grep(".csv", datafile(), ignore.case = TRUE)) > 0){
          return(
            data.frame(
              read.csv(datafile()$datapath, na.strings="")
            ))
        }else if(length(grep(".sas7bdat", datafile(), ignore.case = TRUE)) > 0){
          return(
            data.frame(
              haven::read_sas(datafile()$datapath) 
            ))
        }
      }
    })
    
    
    output$cbk_int <- renderCodebook({
      req(!is.null(data_choice()))
      codebook(data=data_choice())
    })
    
    output$cbk_sta <- renderUI({
      req(!is.null(data_choice()))
      
      if (! input$data %in% c("Select a dataset", "Data upload")){
        suppressWarnings(  ## suppress warning that comes from Hmisc about pixels
          Hmisc::html(Hmisc::describe(data_choice(), descript=input$data)) 
        )      } else {
          suppressWarnings(  ## suppress warning that comes from Hmisc about pixels
            Hmisc::html(Hmisc::describe(data_choice(), descript=input$datafile$name)) 
          )      }
    
    })
    
    output$dl <- downloadHandler(
      filename = function() {
        if (! input$data %in% c("Select a dataset", "Data upload")){
          paste("cbk-", input$data, "-", Sys.Date(), ".html", sep="") 
        } else {
          paste("cbk-", tools::file_path_sans_ext(input$datafile$name), "-", Sys.Date(), ".html", sep="")
        }
      },
      content = function(file) {
        if (input$type=="Interactive"){
          htmlwidgets::saveWidget(codebook(data=data_choice()), file = file) 
        } else {
          if (! input$data %in% c("Select a dataset", "Data upload")){
            htmltools::save_html(
              suppressWarnings(
                Hmisc::html(Hmisc::describe(data_choice(), descript=input$data))
              ), 
              file = file) 
          } else {
            htmltools::save_html(
              suppressWarnings(
                Hmisc::html(Hmisc::describe(data_choice(), descript=input$datafile$name))
              ), 
              file = file)          }
        }
      }
    )
    
  }
  
  runGadget(ui, server, viewer = browserViewer(browser = getOption("browser")))
}



