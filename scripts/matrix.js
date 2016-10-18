
var actionDispatcher = Class.create({
  initialize: function(){

  },

  liftToTop: function(elem){
    plane = elem.parentNode
    plane.appendChild(elem)
  },

  toggleCell: function(selection){
    // change cell color by css class
    var cellSelection = d3.select(selection)
    cellSelection.classed("cell-mouse-over", !cellSelection.classed("cell-mouse-over"))
  },

  activateRow: function(rowNum){

    // highlight row text
    d3.selectAll(".matrix-row").classed("row-active", function(d, i) {
      return  rowNum === i;
    })
    // highlight background
    d3.selectAll(".matrix-row-background").classed("row-background-active", function(d, i){
      return rowNum === d.x;
    })


  },

  deactivateRow: function(rowNum){
    d3.selectAll(".matrix-row").classed("row-active", false)
    d3.selectAll(".matrix-row-background").classed("row-background-active", false)
  },

  toggleMultipleRow: function(keyPool){
    d3.selectAll(".matrix-row").each(function(d, i){
      var elm = d3.select(this)
      var elmBackground = d3.select(elm.node().firstChild)
      if (keyPool.indexOf(d.data.key) !== -1){
        elm.classed("row-active", !elm.classed("row-active"))
        elmBackground.classed("row-background-active", !elmBackground.classed("row-background-active"))
      }
    })
  },

  activateCol: function(colNum){
    d3.selectAll(".matrix-column").classed("column-active", function(d, i) {
      return  colNum === i;
    })
  },

  deactivateCol: function(rowNum){
    d3.selectAll(".matrix-column").classed("column-active", false)
  },

  toggleMultipleCol: function(keyPool){
    d3.selectAll(".matrix-column").each(function(c, j){
      var elm = d3.select(this)
      if (keyPool.indexOf(c.data.key) !== -1){
        elm.classed("column-active", !elm.classed("column-active"))
      }
    })
  },

  toggleTooltip: function(selection){
    var tooltipSelection = d3.select(selection)
    tooltipSelection.classed("tooltips-active", !tooltipSelection.classed("tooltips-active"))
  },

  // re-sort .matrix-row to restore rect element order
  sortRows: function(){
    var self = this
    // convert NodeList > Array
    var matrixRows = Array.prototype.slice.call(d3.selectAll(".matrix-row")._groups[0])

    // sort based on transform.translateX
    matrixRows.sort(function(a, b){
      var test = /.*\,(.+)\).*/
      return a.getAttribute("transform").match(test)[1] - b.getAttribute("transform").match(test)[1]
    })

    // apply order to this.state.svg
    matrixRows.each(function(n){
      self.liftToTop(n)
    })
  }

})



/**
 * Term Class
 */

var Term = Class.create({

  initialize: function(key, text, link){
    this.key = key
    this.text = text
    this.link = link // type [String]
    this.linkContent = new Array() // [term]
  },

  print: function(){
    console.log(this.key + ' : ' + this.text)
  },

  hasKey: function(k){
    return this.key === k
  },

  populateWith: function(otherTerm){
    // @param otherTerm: array of term object to choose from
    this.link.each(function(l){
      var filtered = otherTerm.filter(function(s){ return s.key === l })
      this.linkContent = this.linkContent.concat(filtered)
    }, this)

  }
})


var Symptom = Class.create(Term, {})
var Disorder = Class.create(Term, {})



/**
 * Matrix Class
 */

var Matrix = Class.create({
  initialize: function(){
    this.grid = new Array()
  },

  addRow: function(arr){
    this.grid.push(arr)
    return this.grid[this.grid.length-1]
  }
})

/**
 * Data Handler Class
 */

var dataHandler = Class.create({
  initialize: function(inputData, config){
    this.config = config

    this.inputData = inputData
    this.procData = this.preProcess(this.inputData)
    this.popData = this.populateLinkContent(this.procData)
    this.matrix = this.toMatrix(this.popData)
  },

  // utility for sorting data
  setUpOrderingByFreq: function(data){
    var config = this.config
    // sort symptom based on the number of connected disorders
    data.symptom.sort(function(a, b){return b.link.length - a.link.length; })
    data.symptom = data.symptom.slice(0, config.numSymptomdisplayed)

    // do not sort data.disorder because its ranked already
  },

  populateLinkContent: function(data){
    data.disorder.each(function(d){
      d.populateWith(data.symptom)
    })
    return data
  },

  // preprocess data into correct data structure
  preProcess: function(inputData){
    var config = this.config
    var procData = {
      "disorder": [],
      "symptom": []
    }

    // data = [{disorder}, {disorder}, ...]
    //          disorder = {key, text, {symptom}}
    //                                  symptom = {key, text}
    inputData.each(function(d){

      // populate procData.symptom
      d.symptom.each(function(s){
        // construct non duplicate array
        var idx = procData.symptom.map(function(x){return x.key;}).indexOf(s.key);
        if (idx === -1){
          // push new symptom object if not exist
          procData.symptom.push(new Symptom(s.key, s.text, [d.key]))
        } else {
          // add to symptom.link if exists
          procData.symptom[idx].link.push(d.key)
        }
      })

      // populate procData.disorder
      procData.disorder.push(new Disorder(d.key, d.text, d.symptom.map(function(x){return x.key;})))
    })

    return procData
  },

  // pre Process data to matrix
  toMatrix: function(data){

    // ordering of raw data
    this.setUpOrderingByFreq(data)

    // populate matrix
    var matrix = new Matrix()
    data.disorder.each(function(d, i){

      // construct row
      var row = matrix.addRow([])
      Object.defineProperty(row, 'data', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: d
      })
      Object.defineProperty(row, 'x', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: i
      })


      // construct cell for curr row
      data.symptom.each(function(s, j){
        row[j] = {
          x: i,
          y: j,
          z: (d.link.indexOf(s.key) != -1)? true: false
        }
        Object.defineProperty(row[j], 'data', {
          enumerable: false,
          configurable: true,
          writable: true,
          value: s
        })
      })

    })
    return matrix.grid
  }

}) // end dataHandler class
