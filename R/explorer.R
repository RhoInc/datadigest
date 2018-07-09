#' Create an interactive codebook
#'
#' This function creates a series of interactive codebook using R htmlwidgets.
#'
#' @param data  A list of (optionally named) data frames. Also accepts a character vector of data frame names (must be loaded in environment).
#' @param addEnv  Logical. Indicates whether to add all data frames in current environemnt to explorer. Defaults to \code{addEnv=TRUE}.
#' @param demo   Logical. Indicates whether to display demo data frames.  If \code{TRUE}, \code{dataList} and \code{addEnv} settings will be ignored.  Defaults to \code{demo=FALSE}.

#'
#' @examples
#' explorer(data = list(Cars = mtcars, Iris = iris))
#' 
#' explorer(data = c("mtcars", "iris"))
#'
#' @import htmlwidgets
#' @importFrom jsonlite toJSON
#'
#' @export
explorer <- function(data = NULL, addEnv=TRUE, demo=FALSE) {

  # get names of files in dataList as text string
  if (is.list(data)){
    if(is.null(names(data))){
      names_spec <- rep("", length(data))
    }else{
      names_spec <- names(data)
    }
    names_auto <- deparse(substitute(data))
    names_auto <- gsub("list\\(|\\)","", names_auto)
    names_auto <- unlist(lapply(strsplit(names_auto, split = ","), trimws))
    
    out <- data.frame(names_spec, names_auto, stringsAsFactors = FALSE)
    namesList <- ifelse(out$names_spec=="", out$names_auto, out$names_spec)
    out <- NULL
    names(data) <- NULL
  } else { 
    namesList <- data
  }

  # (1) Initialize the settings with the raw values passed to the r function
  rSettings = list(
    rParams=list(
      data = data,
      addEnv = addEnv
    ),
    settings = list(
        files=list(),
        meta=list(),
        labelCol="File"
    )
  )

  formatFileList <- function(fileList){
    fileList_formatted <- list()
    if (is.list(fileList)){
      for (i in seq_along(fileList)){
        df <- fileList[[i]]
        fileList_formatted[[i]] <- list(
          File = namesList[i],
          Rows = nrow(df),
          Columns = ncol(df),
          json = jsonlite::toJSON(df)
        )
      }      
    } else if (is.vector(fileList)){
      for (i in seq_along(fileList)){
        df <- get(fileList[i])
        fileList_formatted[[i]] <- list(
          File = fileList[i],
          Rows = nrow(df),
          Columns = ncol(df),
          json = jsonlite::toJSON(df)
        )
      }
    }
    return(fileList_formatted)
  }

  
  # (2) Prep an array of objects for the user-specified files  (if length(dataArray)>0)
    data_list_formatted <- formatFileList(data)
    if(length(data_list_formatted)>0){
      rSettings[["settings"]][["files"]] = c(rSettings[["settings"]][["files"]], data_list_formatted)
    }

  # (3) Prep an array of objects for the environment files (if addEnv=T)
  if(addEnv){
    if(length(ls(pos=1))>0){
      env_list <- ls(pos=1)[sapply(ls(pos=1), function(x) inherits(get(x), "data.frame"))]
      env_list_formatted <- formatFileList(env_list)
      if(length(env_list_formatted)>0){
        rSettings[["settings"]][["files"]] = c(rSettings[["settings"]][["files"]], env_list_formatted)
      } else {
        warning("No datasets to add from working environment; continuing with other user specified data sets.")
      } 
      
      if(length(ls(pos=1)[sapply(ls(pos=1), function(x) inherits(get(x), "tbl_df"))])>0){
        warning("Explorer may not work as expected on objects of class `tbl_df` that contain list-columns.")
      }
    }
    else{
      warning("No datasets to add from working environment; continuing with other user specified data sets.")
    }
    
  }

  # (4) load 20 datasets and put them in the environment (if demo=T)
  if(demo){
    demo_list = ls("package:datasets")[sapply(ls("package:datasets"), function(x) inherits(get(x), "data.frame"))]
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


#' Shiny bindings for codebook-explorer
#'
#' Output and render functions for using codebook-explorer within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a codebook-explorer
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

#' @rdname explorer-shiny
#' @export
renderExplorer <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, explorerOutput, env, quoted = TRUE)
}
