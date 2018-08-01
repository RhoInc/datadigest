#' Create an interactive codebook
#'
#' This function creates an interactive codebook from a user specified data frame using.using R htmlwidgets.  
#' The codebook can be explored using the RStudio viewer or a web browser.  
#' The codebook can also be embedded in an R Markdown document or saved as a standalone HTML page.
#' 
#'
#' @param data  A data frame.
#' @param settings Optional list of custom settings.   
#' 
#' @details 
#' \describe{
#'   \item{settings}{
#'   If provided, the list of custom settings will be converted to JSON using \code{jsonlite::toJSON}. 
#'   Details on configuration of the settings object can be found at \url{https://github.com/RhoInc/web-codebook/wiki/Configuration}.  
#'   }
#' }
#'
#' @examples
#' codebook(data=mtcars)
#'
#' @import htmlwidgets
#' @importFrom tibble is_tibble
#' @importFrom jsonlite toJSON
#' 
#' @seealso explorer
#' 
#' @export
codebook <- function(data, settings = NULL) {

  if(tibble::is_tibble(data)){
    warning("Codebook may not work as expected on objects of class `tbl_df` that contain list-columns.")  
  }
  
  # forward options using x
  rSettings = list(
    data=data,
    settings=jsonlite::toJSON(settings)
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'codebook',
    rSettings,
    package = 'codebook', 
    sizingPolicy = htmlwidgets::sizingPolicy(
      viewer.fill=FALSE
    )
  )
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
#' @name codebook-shiny
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
