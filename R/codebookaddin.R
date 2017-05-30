#' codebookaddin
#'
#' Addin for creating an interactive codebook
#' @export
codebookaddin <- function(){

  ui <- miniPage(

    gadgetTitleBar(a(href="https://github.com/RhoInc/webcodebook", "Interactive Codebook Add-in"),
                 #  left = miniTitleBarCancelButton("cancel","Cancel"),
                 left = selectInput("data", NULL, choices=c("Select a dataset")),
                 right = miniTitleBarButton("save", "Save as HTML", primary = TRUE)),
                # right = downloadButton("download","Download as HTML")),
    miniContentPanel(
       fillCol(
        flex=c(1,6),
        # fillRow(
        #   flex=c(3,1),
        #   div(textOutput("n"), style = "font-weight: bold"),
        #   selectInput("data","Select a dataset",choices=c('mtcars','iris'), selected=NULL)
        # ),
        codebook::codebookOutput("cbk")
      )
    )
  )


  server <- function(input, output, session){

    
    # find all loaded datasets
    df <- reactiveValues(names = ls(pos=1)[sapply(ls(pos=1), function(x) class(get(x))) == 'data.frame'])

    observe({print(df$names)})


    observeEvent(!is.null(df$names), {
      names <- c("Select a dataset", df$names)
      updateSelectInput(session, "data",choices = names)
    })

    data_choice <- reactive({
      if(input$data=="Select a dataset"){
        return(NULL)
      } else{
        return(get(input$data))
      }
    })

    output$cbk <- codebook::renderCodebook({
        req(!is.null(data_choice()))
        codebook::codebook(data=data_choice())
    })

    # output$download <- downloadHandler(
    #   filename = function() {
    #     paste("cbk-", data_choice(), "-", Sys.Date(), ".html", sep="")
    #   },
    #   content = function(file) {
    #     htmlwidgets::saveWidget(codebook(data=data_choice()), file = file)
    #   }
    # )

    observeEvent(input$save, {
      file <- paste0("cbk-", data_choice(), "-", Sys.Date(), ".html")
      htmlwidgets::saveWidget(codebook(data=data_choice()), file=file)
    })
    
    observeEvent(input$cancel, {
      stopApp()
    })
  }

  viewer <- dialogViewer("Create an interactive web codebook", width = 1200, height = 900)
  runGadget(ui, server, viewer = viewer)
}



