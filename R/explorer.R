#' Create an interactive codebook
#'
#' This function creates a series of interactive codebook using R htmlwidgets.
#'
#' @param dataArray  a list of dataframes (TODO change to tibble?).
#' @param addEnv  boolean. Indicates whether to add all data frames in current environemnt to explorer.

#'
#' @examples
#' explorer(dataArray=c(cars, iris))
#'
#' @import htmlwidgets
#'
#' @export
explorer <- function(dataList=c(), addEnv=T, demo=F) {
  # (1) Initialize the settings with the raw values passed to the r function
  rSettings = list(
    rParams=list(
      dataList = dataList,
      addEnv = addEnv
    ),
    settings = list(
        files=list(),
        meta=list(),
        labelCol="File"
    )
  )

  formatFileList<-function(fileList){
    fileList_formatted = list()
    i<-1
    for(f in fileList){
      df<-get(f)
      if(class(df)=="data.frame"){
        fileObj = list(
          File=f,
          Rows = dim(df)[1],
          Columns = dim(df)[2],
          json = jsonlite::toJSON(df)
        )
        fileList_formatted[[i]]<-fileObj
        i<-i+1
      }
    }
    return(fileList_formatted)
  }

  # (2) Prep an array of objects for the user-specified files  (if length(dataArray)>0)
    data_list_formatted <- formatFileList(dataList)
    if(length(data_list_formatted)>0){
      rSettings[["settings"]][["files"]] = c(rSettings[["settings"]][["files"]], data_list_formatted)
    }


  # (3) Prep an array of objects for the environment files (if addEnv=T)
  if(addEnv){
    env_list <- ls(pos=1)[sapply(ls(pos=1), function(x) class(get(x))) == 'data.frame']
    env_list_formatted <- formatFileList(env_list)
    if(length(env_list_formatted)>0){
      rSettings[["settings"]][["files"]] = c(rSettings[["settings"]][["files"]], env_list_formatted)
    }
  }

  # (4) load 20 datasets and put them in the environment (if demo=T)
  if(demo==T){
    demo_list = ls("package:datasets")[sapply(ls("package:datasets"), function(x) class(get(x))) == 'data.frame']

    demo_list_formatted <- formatFileList(demo_list)
    rSettings[["settings"]][["files"]] = demo_list_formatted #ignores other settings
  }

  # (4) create widget
  htmlwidgets::createWidget(
    name = 'explorer',
    rSettings,
    package = 'codebook', 
    sizingPolicy = htmlwidgets::sizingPolicy(
      viewer.fill=FALSE
    )
  )
}

  #' Shiny bindings for Explorer
  #'
  #' Output and render functions for using codebook within Shiny
  #' applications and interactive Rmd documents.
  #'
  #' @param outputId output variable to read from
  #' @param width,height Must be a valid CSS unit (like \code{'100\%'},
  #'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
  #'   string and have \code{'px'} appended.
  #' @param expr An expression that generates a codebook
  #' @param env The environment in which to evaluate \code{expr}.
  #' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
  #'   is useful if you want to save an expression in a variable.
  #'
  #' @name explorer-shiny
  #'
  #' @export
  explorerOutput <- function(outputId, width = '100%', height = '400px'){
    htmlwidgets::shinyWidgetOutput(outputId, 'explorer', width, height, package = 'codebook')
  }

  #' Shiny bindings for codebook
  #'
  #' Output and render functions for using codebook within Shiny
  #' applications and interactive Rmd documents.
  #'
  #' @param outputId output variable to read from
  #' @param width,height Must be a valid CSS unit (like \code{'100\%'},
  #'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
  #'   string and have \code{'px'} appended.
  #' @param expr An expression that generates a codebook
  #' @param env The environment in which to evaluate \code{expr}.
  #' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
  #'   is useful if you want to save an expression in a variable.
  #'
  #' @name explorer-shiny
  #'
  #' @export
  codebookOutput <- function(outputId, width = '100%', height = '400px'){
    htmlwidgets::shinyWidgetOutput(outputId, 'codebook', width, height, package = 'codebook')
  }

  #' @rdname codebook-shiny
  #' @export

  renderCodebook <- function(expr, env = parent.frame(), quoted = FALSE) {
    if (!quoted) { expr <- substitute(expr) } # force quoted
    htmlwidgets::shinyRenderWidget(expr, codebookOutput, env, quoted = TRUE)
  }
