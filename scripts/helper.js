// adding a new method to prototype
Element.addMethods({
    removeAllChildElement: function(elm) {
        var elm = $(elm)
        elm.descendants().each(function(e) {
            Event.stopObserving(e)
        })
        return elm.update()
    }
})


// Aggregation of events
var actionDispatcher = Class.create({

    // initialize with config and state of widget
    initialize: function(config, state) {
        this.config = config
        this.state = state
    },

    // populates right info bar with Disorder related information
    updateInfoBar: function(d) {

        this.updateInfoHeading(d.data)

        // symptomList includes every phenotype associated with the disorder d
        var symptomList = this.state.dataHandler.getSymptomList(d.data.key)

        // filters out phenotypic abnormalities
        var nonphenotypicAbnormalityList = symptomList.filter(function(s) {
            return !s.isPhenotypicAbnormality
        })
        // filters out non-phenotypic abnormalities
        var phenotypicAbnormality = symptomList.filter(function(s) {
            return s.isPhenotypicAbnormality
        })

        this.updateNonPhenotypicAbnormalityBlock(nonphenotypicAbnormalityList)
        this.updateInfoDetailsList(phenotypicAbnormality)
    },

    // updates InfoHeadings with disorder's data
    updateInfoHeading: function(d) {
        var omimID = d.getKey()
        var omimIDNumber = omimID.match(/\d+/) // number only..
        var omimText = d.getText()
        var joinedText = omimText
        if (Array.isArray(omimText)) {
            joinedText = omimText.join("\n")
        }

        // removes pre-existing content
        var infoHeading = d3.select("#DiagramInfoHeading")
            .html("")

        // button links to OMIM website
        infoHeading.append("button")
            .attr("class", "omimLinkButton")
            .append("a")
            .attr("class", "instantSearchLink")
            .attr("target", "_blank")
            .attr("href", "http://www.omim.org/")
            .text("OMIM")

        // button links to current disorder page under OMIM website
        infoHeading.append("button")
            .attr("class", "omimLinkButton")
            .append("a")
            .attr("class", "instantSearchLink")
            .attr("target", "_blank")
            .attr("href", "http://www.omim.org/entry/" + omimIDNumber)
            .text(omimID)

        d3.select("#DiagramInfoHeadingMain")
            .text(joinedText)
    },

    // updates non-phenotypeic abnormality block
    updateNonPhenotypicAbnormalityBlock: function(nonphenotypicAbnormalityList) {
        // clean up
        $("phenotypicAbnormalityBlock").removeAllChildElement()

        // updates non-phenotypic abnormality block
        d3.select("#phenotypicAbnormalityBlock")
            .selectAll(".nonPhenotypes")
            .data(nonphenotypicAbnormalityList)
            .enter().append("button")
            .attr("class", "phenotypeButton")
            .append("a")
            .attr("class", "phenotypeButtonLink")
            .attr("target", "_blank")
            .attr("href", function(d) {
                return "http://compbio.charite.de/hpoweb/showterm?id=" + d.key
            })
            .text(function(d) {
                return d.text
            })
    },

    // populates infoDetails table with a list of symptoms
    updateInfoDetailsList: function(symptom) {
        var config = this.config
        var state = this.state

        // change table of symptoms according to height of infobar heading
        d3.select("#infoDetails")
            .style("max-height", (config.totalHeight - d3.select("#InfoHeading").node().getBoundingClientRect().height - 4) + "px")

        // sort symptom to lift those with match to top
        symptom.sort(function(a, b) {
            if (a.matches && !b.matches) {
                return -1
            } else if (!a.matches && b.matches) {
                return 1
            } else {
                return 0
            }
        })

        // flatten the symptoms to fit in table rows
        var flattenedSymptoms = []
        symptom.each(function(s) {
            flattenedSymptoms.push(s)
            if (s.matches && s.matches.length !== 0) {
                flattenedSymptoms = flattenedSymptoms.concat(s.matches)
            }
        })

        // populates each table row with symptom names
        $("infoDetailsTable").removeAllChildElement()
        var tableCell = d3.select("#infoDetailsTable").selectAll(".infoDetailsTableItem")
            .data(flattenedSymptoms)
            .enter().append("tr")
            .attr("class", "infoDetailsTableItem")
            .append("th")
            .style("width", config.rightContainer.width)
            .style("color", function(d) {
                // assigns color to tr text to correspond to matching cell color
                if (d.matches) {
                    return "#5c5c5c"
                } else if (d.category === "ancestor" || d.category === "match") {
                    return config.cellStrokeColor
                } else if (d.category === "missmatch") {
                    return config.cellMissMatchColor
                }
            })

        // appends cell symbols to matching phenotypes
        tableCell.append("span")
            .filter(function(d) {
                return d.category
            })
            .attr("class", function(s) {
                if (s.category) {
                    return "infoDetailsTableItemSymbol"
                }
            })
            .append("svg")
            .attr("width", state.scale.x.bandwidth() / 1.5)
            .attr("height", state.scale.y.bandwidth() / 1.5)
            .append("path")
            .attr("transform", "translate(" + state.scale.x.bandwidth() / 3 + ", " + state.scale.y.bandwidth() / 2.8 + ") rotate(45)")
            .attr("d", d3.symbol()
                .size([1 / 8 * state.scale.x.bandwidth() * state.scale.x.bandwidth()])
                .type(function(d) {
                    var symbol = "symbol" + config.cellSymbol[d.category]
                    return d3[symbol] || d3.symbolCircle
                }).bind(this)
            )
            .style("fill", function(d) {
                if (d.category === "ancestor") {
                    return config.cellFillColor
                } else if (d.category === "missmatch") {
                    return config.cellMissMatchColor
                }
                return config.cellStrokeColor
            })
            .style("stroke", function(d) {
                if (d.category === "missmatch") {
                    return config.cellMissMatchColor
                }
                return config.cellStrokeColor
            })
            .style("stroke-width", state.scale.x.bandwidth() / 8)

        // now appends matching phenotype's name
        tableCell.append("span")
            .attr("class", function(s) {
                if (s.category) {
                    return "infoDetailsTableItemText"
                }
            })
            .text(function(s) {
                return s.getText()
            })

    },

    // matrix cell click event
    toggleCell: function(selection) {
        // change cell color by css class
        var cellSelection = d3.select(selection)
        cellSelection.classed("cell-mouse-over", !cellSelection.classed("cell-mouse-over"))

        // apply filters
        var filter = (cellSelection.attr("filter") === "url(#drop-shadow)" ? null : "url(#drop-shadow)")
        cellSelection.attr("filter", filter)

    },

    // matrix row hover event
    toggleRow: function(rowNum) {
        this.toggleRowHeading(rowNum)
        this.toggleRowBackground(rowNum)
    },

    // highlights row headings text
    toggleRowHeading: function(rowNum) {
        // highlight row text
        d3.selectAll(".matrix-row")
            .filter(function(d, i) {
                return rowNum === i
            })
            .classed("row-active", function(d, i) {
                return !d3.select(this).classed("row-active")
            })
    },

    // highlights row background color
    toggleRowBackground: function(rowNum) {
        // highlight background
        d3.selectAll(".matrix-row-background")
            .filter(function(d) {
                return rowNum === d.x
            })
            .classed("row-background-active", function(d, i) {
                return !d3.select(this).classed("row-background-active")
            })
    },

    // row heading click event
    toggleRowHeadingUnderline: function(rowNum) {
        d3.selectAll(".matrix-row-text")
            .filter(function(d) {
                return rowNum !== d.x
            })
            .attr("text-decoration", "none")

        d3.selectAll(".matrix-row-text")
            .filter(function(d) {
                return rowNum === d.x
            })
            .attr("text-decoration", "underline")
            .style("text-decoration-color", this.config.cellStrokeColor)
    },

    // column heading hover event
    //    highlights multiple rows based on associated symptom
    toggleMultipleRow: function(symptomKey) {
        var self = this

        d3.selectAll(".matrix-row").each(function(d, i) {
            var elm = d3.select(this)
            var elmBackground = d3.select(elm.node().firstChild)

            var symtomList = d.data.symptom
            var index = symtomList.map(function(s) {
                return s.key
            }).indexOf(symptomKey)

            if (index !== -1 && symtomList[index].category !== 'unknown') {
                self.toggleRow(i)
            }
        })
    },

    // column hover event
    toggleColumn: function(colNum) {

        var col = d3.selectAll(".matrix-column")
            .filter(function(d, i) {
                return colNum === i
            })
            .classed("column-active", function(d) {
                return !d3.select(this)
                    .classed("column-active")
            })
        this.toggleColText(col.node().getElementsByClassName("matrix-column-text")[0])
    },

    // highlight column heading text
    toggleColText: function(elm) {
        var config = this.config
        d3.select(elm).attr("fill", function(d) {
            if (d.data.disabled) {
                return config.color.default.disabled;
            }
            var highlightColor = d.data.type && (config.color.highlight[d.data.type] || "lightgrey")
            var defaultColor = d.data.type && (config.color.default[d.data.type] || "lightgrey")
            var highlight = d3.select(this).attr("fill") === defaultColor ? true : false

            if (highlight) {
                return highlightColor
            }
            return defaultColor
        })
    },

    // row heading hover event
    toggleMultipleCol: function(symptomList) {
        var self = this
        var config = this.config
            // var symptomKeyList = symptomList.map(function(s){return s.key})

        d3.selectAll(".matrix-column").each(function(c, j) {
            var elm = d3.select(this)
            var elmText = elm.node().getElementsByClassName("matrix-column-text")[0]

            var matchedSymptomKeyList = symptomList.filter(function(s) {
                return s.category !== "unknown"
            }).map(function(s) {
                return s.key
            })

            if (matchedSymptomKeyList.indexOf(c.data.key) !== -1) {
                self.toggleColumn(j)
            }
        })
    },

    // show tooltip upon hover to Symptom and Disorder text
    showToolTip: function(currElem, d) {
        var config = this.config
        var state = this.state

        var matrix = currElem.getScreenCTM()
            .translate(+currElem.getAttribute("cx"), +currElem.getAttribute("cy"))

        var isDisorder = d.data.hasOwnProperty("symptom")
        var isNotSymptom = d.data.hasOwnProperty("type") && (d.data.type === "not_symptom")

        var textAlignDirection = isDisorder ? "text-align-right" : "text-align-left"
        var topShiftAddition = isDisorder ? state.scale.y.bandwidth() : 0
        var tooltipWidth = isDisorder ? config.tooltip.width + "px" : "auto"
        var hoverTextColor = isNotSymptom ? config.color.default.not_symptom : config.termHoverHighlightColor

        state.tooltip
            .html(function() {
                var title = "<div id='tooltipTitle' class=" + textAlignDirection + ">" + d.data.getText() + "</div>"
                return title
            })
            .transition()
            .delay(10)
            .style("left", 0)
            .style("opacity", 1)
            .style("left", (matrix.e) + "px")
            .style("top", (matrix.f + topShiftAddition) + "px")
            .style("color", hoverTextColor)
            .style("width", tooltipWidth)

    },

    // on mouse out event
    removeToolTip: function() {
        this.state.tooltip
            .html("")
            .transition()
            .delay(10)
            .style("opacity", 0)
    }

})



/**
 * Term Class
 */

var Term = Class.create({

    // Creates a new term
    //    String key: for example HP:0000007
    //    String text: for example Seizures
    initialize: function(key, text) {
        this.key = key
        this.text = this.capitalizeEveryWord(text)
    },

    capitalizeEveryWord: function(text) {
        var capitalized = []
        var lowerCaseCharArray = text.toLowerCase().split(/\s+/)
        lowerCaseCharArray.each(function(lowerCase) {
            capitalized.push(lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1))
        })
        return capitalized.join(" ")
    },

    toString: function() {
        return this.key + ' : ' + this.text
    },

    getKey: function() {
        return this.key
    },

    getText: function() {
        return this.text
    },

    equalTo: function(t) {
        return this.key === t.key && this.text === t.text && typeof this === typeof t
    }

})

// Symptom inherits from Term
var Symptom = Class.create(Term, {

    // Creates a new Symptom object
    //    String type: is one of {symptom, not_symptom, free_symptom}
    //    String category: is one of {missmatch, match, ancestor, and unknown}
    initialize: function($super, key, text, type, category) {
        $super(key, text)
        this.category = category
        this.type = type
    },
    // ranks symptom based on category for sorting
    calculatePrevalence: function() {
        var mapping = {
            'match': 10,
            'ancestor': 1,
            'unknown': 0,
            'missmatch': -1
        }
        if (this.key in Symptom.prevalence) {
            Symptom.prevalence[this.key] += mapping[this.category]
        } else {
            Symptom.prevalence[this.key] = 0
        }
    },

    // set type to symptom or not_symptom or free_symptom
    setType: function(type) {
        if (type === "symptom" || "not_symptom" || "free_symptom") {
            this.type = type
        }
    },
    // set disabled property to symptom
    setDisabled: function(disabled) {
        if (disabled) {
            this.disabled = disabled || true
        } else {
            this.disabled = disabled || false
        }
    },

    // get symptom name and append "NO " if it is a not_symptom
    getText: function() {
        var symText = this.text
        if (this.type === "not_symptom") {
            symText = "NO " + symText
        }
        return symText

    },

    // returns symptom text of a confined length
    getShortText: function() {
        var cutoff = 25
        var shortText = this.getText()
        if (shortText.length > cutoff) {
            shortText = shortText.slice(0, cutoff) + " ..."
        }
        return shortText
    },

    toString: function($super) {
        return $super() + " (" + this.category + ")"
    },

    equalTo: function($super, s) {
        return $super(s) && this.type === s.type && this.category === s.category
    },

    // evaluates symptom based on its category
    // for resolving duplicate symptoms
    greaterThan: function(s) {
        var rule = ['missmatch', 'unknown', 'ancestor', 'match']

        if (!this.equalTo(s)) {
            var self = rule.indexOf(this.category)
            var other = rule.indexOf(s.category)

            if (self === -1 || other === -1) {
                console.log("symptoms in comparison does not have appropriate category");
                return
            }

            // self is greaterThan other:
            // if self is not unknown while other is unknown
            if (self !== 1 && other === 1) {
                return true
            }

            // if self is match and other is ancestor
            if (self === 3 && other === 2) {
                return true
            }

            // if self is a missmatch and other is an ancestor
            if (self === 0 && other === 1) {
                return true
            }

            if ((self === 0 && other > 1) || (self > 1 && other === 0)) {
                console.log("symptoms in comparison is both a missmatch and ancestor/match");
                console.log("user may have selected a parent symptom as not present and a descendent symptom as present");
                return
            }

            return false
        } else {
            // two symptoms are equal in their attributes
            return true
        }
    },

})



var Disorder = Class.create(Term, {

    // symptom is an array of symptoms associated with the disorder
    initialize: function($super, key, text, symptom) {
        $super(key, text)
        this.symptom = symptom
    },

    getKey: function() {
        var a = this.text.split(/[ ,]+/)
        if (a[0]) {
            return a[0]
        }
    },

    getText: function() {
        var a = this.text.split(/[ ,]+/)
        if (a[1]) {
            return a.slice(1).join(" ")
        }
        return
    },

    // returns disorder text of a confined length
    getShortText: function() {
        var disText = this.getText()

        var cutoff = 28
        if (disText.length > cutoff) {
            disText = disText.slice(0, cutoff) + " ..."
        }
        return disText
    }
})


/**
 * Matrix Class
 */

var Matrix = Class.create({
    initialize: function() {
        this.grid = new Array()
    },

    addRow: function(arr) {
        this.grid.push(arr)
        return this.grid[this.grid.length - 1]
    }
})

/**
 * Data Handler
 *  processes data into different data structures
 */
var dataHandler = Class.create({

        initialize: function(data, config, state) {
            this.config = config
            this.state = state

            this.completeData = this.convertToObject(data)
            this.extractMatchesData = this.mergeMatchingSymptoms(data)
            this.procData = this.preProcess(this.extractMatchesData)
            this.matrix = this.toMatrix(this.procData)
        },


        //utility for sorting symptoms
        //    first sort based on Symptom.prevalence
        //    thens sort alphabetically
        setUpOrdering: function(data) {
            var config = this.config

            data.each(function(d) {
                d.symptom.sort(function(a, b) {
                    var aPreva = Symptom.prevalence[a.key]
                    var bPreva = Symptom.prevalence[b.key]

                    if (aPreva > bPreva) {
                        return -1;
                    } else if (aPreva < bPreva) {
                        return 1;
                    } else {
                        // prevalence score equal now sort by alphabet
                        var aAlpha = a.text.toLowerCase()
                        var bAlpha = b.text.toLowerCase()
                        if (aAlpha > bAlpha) {
                            return -1
                        } else if (aAlpha < bAlpha) {
                            return 1
                        } else {
                            return 0
                        }
                    }
                })
            })
        },
        // gets symptoms for disorder with given key
        getSymptomList: function(disKey) {

            var disorder = this.completeData.filter(function(d) {
                if (d.key === disKey) {
                    return true
                }
                return false
            })

            if (disorder[0] && disorder[0].symptom) {
                return disorder[0].symptom
            } else {
                return "undefined"
            }

        },
        // Convert input data to Symptom and Disorder objects
        convertToObject: function(data) {

            var clientSelectedSymptom = this.state.outsideCache.all
            var res = []

            data.each(function(d) {
                var syms = []
                d.symptom.each(function(s) {
                    var sym = new Symptom(s.key, s.text)
                        // annotate disorder associated phenotype
                    if (s.hasOwnProperty("isPhenotypicAbnormality")) {
                        sym.isPhenotypicAbnormality = s.isPhenotypicAbnormality
                    }

                    var matches = []

                    // if symptom has a matching phenotype...
                    if (s.matches && s.matches.length !== 0) {
                        // cast matching phenotypes to Symptom objects
                        var matchObj = s.matches.map(function(m) {
                                var phenotype = new Symptom(m.key, m.text, m.type, m.category)


                                // update disabled property from cache object
                                if (clientSelectedSymptom.hasOwnProperty(phenotype.key)) {
                                    clientSelectedSymptom[phenotype.key].disabled && phenotype.setDisabled(clientSelectedSymptom[phenotype.key].disabled)
                                }
                                return phenotype
                            })
                            // put matching phenotype to symptom...
                        sym.matches = matchObj
                    }
                    syms.push(sym)
                })
                res.push(new Disorder(d.key, d.text, syms))
            })

            return res
        },

        /*
        puts matching symptom directly under Disorder.symptom
        */
        mergeMatchingSymptoms: function(data) {
            var res = JSON.parse(JSON.stringify(data))

            res.each(function(d) {
                var matches = []

                d.symptom.each(function(s) {
                    var matchingSymptoms = s.matches
                    if (matchingSymptoms && matchingSymptoms.length !== 0) {
                        matches = matches.concat(matchingSymptoms)
                    }
                })
                d.symptom = matches
            })
            return res
        },

        //preprocess data into correct data structure
        preProcess: function(data) {
            var config = this.config
            var state = this.state

            if (!state.outsideCache) {
                console.log("cache not existent inside dataHandler Class")
            }
            var clientSelectedSymptom = state.outsideCache.all

            outputData = []

            // initialize static variable for ordering columns
            Symptom.prevalence = {}

            // logically aggregate symptom
            data.each(function(d) {
                if (d.symptom.length === 0) {
                    return
                }
                // construct symptom objects
                var original = d.symptom.map(function(s) {
                        var sym = new Symptom(s.key, s.text, s.type, s.category)
                        sym.calculatePrevalence()
                        if (clientSelectedSymptom.hasOwnProperty(sym.key)) {
                            clientSelectedSymptom[s.key].disabled && sym.setDisabled(clientSelectedSymptom[s.key].disabled)
                        }

                        return sym
                    })

                // evaluate symptom category and eliminate redundant ones
                var nonDuplicates = []
                // adding user-selected phenotype that did not match anything in the array
                var nonDuplicates = Object.keys(clientSelectedSymptom).map(function(k) {
                    var s = clientSelectedSymptom[k]
                    var sym = new Symptom(s.key, s.text, s.type, "unknown")
                    sym.calculatePrevalence()
                    if (clientSelectedSymptom.hasOwnProperty(sym.key)) {
                        clientSelectedSymptom[s.key].disabled && sym.setDisabled(clientSelectedSymptom[s.key].disabled)
                    }
                    return sym
                })

                while (original.length !== 0) {
                    var next = original.pop()
                    var pushAgain = true

                    for (i = 0; i < nonDuplicates.length; i++) {
                        within = nonDuplicates[i]
                        if (next.key === within.key) {
                            pushAgain = false
                            if (next.greaterThan(within)) {
                                // console.log('REPLACE: ' + within.toString() + " => " + next.toString());
                                nonDuplicates[i] = next
                                break
                            } else {
                                // console.log('DO NOTHING: ' + within.toString());
                            }
                        }
                    }

                    if (pushAgain) {
                        // console.log("PUSHED: " + next.toString());
                        nonDuplicates.push(next)
                    }
                }

                d.symptom = nonDuplicates
                outputData.push(new Disorder(d.key, d.text, d.symptom))

            })
            return outputData
        },

        // convert data to matrix format ß
        toMatrix: function(data) {

            // ordering of raw data
            this.setUpOrdering(data)

            // populate matrix
            var matrix = new Matrix()
            data.each(function(d, i) {

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
                d.symptom.each(function(s, j) {
                    row[j] = {
                        x: i,
                        y: j,
                        z: (s.category !== 'unknown') ? true : false
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
