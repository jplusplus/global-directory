
$(function(){
    var nd = new Pyk.newsDiscovery();
    nd.init();
});

var Pyk = {};

Pyk.newsDiscovery = function(){

    this.init = function(){
        var that = this;

        // Load Facets & Render
        $.getJSON("res/data/facet.json", function(json){
            that.facet = json;
            that.renderColHeadings();
        });

        // Load Data, Create Crossfilter & Render
        $.getJSON("res/data/data.json", function(json){
            that.data = json;
            that.initCrossfilter();
            that.renderTags();
        });
    };


    this.renderColHeadings = function(){
        var h4s = $(".tag-holder h4"); // Capture all the required <h4> tags
        var f = this.facet.children;  // Get the data that corresponds to it
        for(var i in f) $(h4s[i]).html(f[i].label);
    };


    this.initCrossfilter = function(){
        this.crossfilter = {};
        this.crossfilter.data = crossfilter(this.data.children);

        this.crossfilter.id_dimension = this.crossfilter.data.dimension(function(d){
            return d.id;
        });

        this.crossfilter.dd_dimension = this.crossfilter.data.dimension(function(d){
            return d.country;
        });

        this.crossfilter.ff_dimension = this.crossfilter.data.dimension(function(d){
            return d.institution;
        });

        // --  -- //
        // We need 2 identical dimensions for the numbers to update
        // See http://git.io/_IvVUw for details
        this.crossfilter.aa_dimension = this.crossfilter.data.dimension(function(d){
            return d.skills;
        });

        // This is the dimension that we'll use for rendering
        this.crossfilter.aar_dimension = this.crossfilter.data.dimension(function(d){
            return d.skills;
        });

        // Create empty filter roster
        this.activeFilters = {
            "ff": [],
            "dd": [],
            "aa": [],
            "id": []
        };
    };


    this.renderTags = function(){

        var that = this;

        // 
        var aa_tags = this._aaReduce(this.crossfilter.aar_dimension.groupAll().reduce(reduceAdd, reduceRemove, reduceInitial).value());
        var aa_list = d3.select("#table3").selectAll("li").data(aa_tags);
        aa_list.enter().append("li");
        aa_list
            .html(function(d){
                var link = "<a href='#'>" + d.key;
                link += "<span class='badge'>" + d.value + "</span>";
                link += "</a>";
                return link;
            })
            .classed("active", function(d){
                return that._isActiveFilter("aa", d.key);
            })
            .on("click", function(d){
                that.filter("aa", d.key);
            });
        aa_list.exit().remove();



        // D
        var dd_tags = this._removeEmptyKeys(this.crossfilter.dd_dimension.group().all(), "dd");
        var dd_list = d3.select("#table1").selectAll("li").data(dd_tags);
        dd_list.enter().append("li");
        dd_list
            .html(function(d){
                var link = "<a href='#'>" + d.key;
                link += "<span class='badge'>" + d.value + "</span>";
                link += "</a>";
                return link;
            })
            .classed("active", function(d){
                return that._isActiveFilter("dd", d.key);
            })
            .on("click", function(d){
                that.filter("dd", d.key);
            });
        dd_list.exit().remove();


        //
        var ff_tags = this._removeEmptyKeys(this.crossfilter.ff_dimension.group().all(), "ff");
        var ff_list = d3.select("#table2").selectAll("li").data(ff_tags);
        ff_list.enter().append("li");
        ff_list
            .html(function(d){
                var link = "<a href='#'>" + d.key;
                link += "<span class='badge'>" + d.value + "</span>";
                link += "</a>";
                return link;
            })
            .classed("active", function(d){
                return that._isActiveFilter("ff", d.key);
            })
            .on("click", function(d){
                that.filter("ff", d.key);
            });
        ff_list.exit().remove();


        // Title
        var id_tags = this._removeEmptyKeys(this.crossfilter.id_dimension.group().all(), "id");
        var id_list = d3.select("#table4").selectAll("li").data(id_tags);
        id_list.enter().append("li");
        id_list
            .html(function(d){
                var a = that._findArticleById(d.key);
                var link = "<a href='#'>" + a.title;
                link += "<span class='badge'>" + d.value + "</span>";
                link += "</a>";
                return link;
            })
            .classed("active", function(d){
                return that._isActiveFilter("id", d.key);
            })
            .on("click", function(d){
                that.filter("id", d.key);
            });
        id_list.exit().remove();

        // Grid at the bottom
        d3.select("#grid").selectAll("li").remove();
        var grid_list = d3.select("#grid").selectAll("li").data(id_tags);
        grid_list.enter()
            .append("li")
            .html(function(d,i){
                var a = that._findArticleById(d.key);
                var container = $("<div/>").addClass("panel");
                var front = $("<div/>").addClass("front");
                var back  = $("<div/>").addClass("back");
                front.html("<a class='thumbnail' target='_blank' href='" + a.url + "'><img src='"+a.image_url+"' width='117' height='130' /><br/>" + a.title);
                var back_content = "";
                back_content += $("<div/>").addClass("name").html(a.title).get(0).outerHTML;
                back_content += $("<div/>").addClass("institution").html(a.institution).get(0).outerHTML;
                back_content += $("<div/>").addClass("city").html(a.city + ", " + a.country).get(0).outerHTML;
                back_content += $("<div/>").addClass("pgp").html("PGP: " + '<a href="' + a.pgp_url + '" target="_self">' + a.pgp + "</a>").get(0).outerHTML;

                back_content += $("<div/>").addClass("email").html("<br>" + '<i class="fa fa-envelope fa-lg"></i> ' + '<a href="' + "mailto:" + a.email_url + '">'  + a.email + "</a>").get(0).outerHTML;
                back_content += $("<div/>").addClass("twitter").html('<i class="fa fa-twitter fa-lg"></i> ' + '<a href="' + a.twitter_url + '" target="_blank">' + a.twitter + "</a>").get(0).outerHTML;    
                back_content += $("<div/>").addClass("github").html('<i class="fa fa-github fa-lg"></i> ' + '<a href="' + a.github_url + '" target="_blank">' + a.github + "</a>").get(0).outerHTML;
                back_content += $("<div/>").addClass("website").html('<i class="fa fa-globe fa-lg"></i> ' + '<a href="' + a.website_url + '" target="_blank">' + a.website + "</a>").get(0).outerHTML;    


                back.html(back_content);
                container.append(front);
                container.append(back);
                return container.get(0).outerHTML;
            })
            .on("mouseover", function(d){
                $(this).find(".panel").addClass("flip");
            })
            .on("mouseout", function(d){
                $(this).find(".panel").removeClass("flip");
            });
        grid_list.exit().remove();
    };

    this.filter = function(d, e){

        var that = this;

        var i = this.activeFilters[d].indexOf(e);
        if(i < 0){
            this.activeFilters[d].push(e);
        }else{
            this.activeFilters[d].splice(i, 1);
        }


        // RUN ALL THE FILTERS! :P
        this.crossfilter.dd_dimension.filterAll();
        if(this.activeFilters["dd"].length > 0){
            this.crossfilter.dd_dimension.filter(function(d){
                return that.activeFilters["dd"].indexOf(d) > -1;
            });
        }

        this.crossfilter.ff_dimension.filterAll();
        if(this.activeFilters["ff"].length > 0){
            this.crossfilter.ff_dimension.filter(function(d){
                return that.activeFilters["ff"].indexOf(d) > -1;
            });
        }

        this.crossfilter.id_dimension.filterAll();
        if(this.activeFilters["id"].length > 0){
            this.crossfilter.id_dimension.filter(function(d){
                return that.activeFilters["id"].indexOf(d) > -1;
            });
        }

        this.crossfilter.aa_dimension.filterAll();
        if(this.activeFilters["aa"].length > 0){
            this.crossfilter.aa_dimension.filter(function(d){
                // d is the data of the dataset
                // f is the filters that are applied
                var f = that.activeFilters["aa"];

                var filter = true;
                for(var i in f){
                    if(d.indexOf(f[i]) < 0) filter = false;
                }

                return filter;
            });
        }


        this.renderTags();
    };


    /*--------------------
      HELPERS
    --------------------*/

    this._isActiveFilter = function(d,e){
        var i = this.activeFilters[d].indexOf(e);
        return i > -1;
    };

    // TODO Optimize this function, use Array.filter/reduce
    // Or create a hashmap of ids and their index in the array on init
    this._findArticleById = function(id){
        var articles = this.data.children;
        for(var i in articles) if(articles[i].id == id) return articles[i];
        return false;
    };

    // This function does two things:
    //  1. Removes keys if their values are 0
    //  2. Removes all the keys but one if a filter is
    //     selected on ff, dd or id
    this._removeEmptyKeys = function(d, dim){
        if(dim === "aa"){
            var a = [];
            for(var i in d) if(d[i].value !== 0) a.push(d[i]);
            return a;
        }

        var f = this.activeFilters[dim];
        if(f.length === 0){
            var a = [];
            for(var i in d) if(d[i].value !== 0) a.push(d[i]);
            return a;
        }else{
            var a = [];
            for(var i  in d) if(f.indexOf(d[i].key) > -1) a.push(d[i]);
            return a;
        }
    };


    // The value we get for ... is in a different
    // format. This function makes it the same
    this._aaReduce = function(d){
        var a = [];
        for(var i in d) a.push({"key": i, "value": d[i]});
        return a;
    };
};


/*------------------------------
Reduce functions for the arrays
of AA. 
------------------------------*/
function reduceAdd(p, v) {
  v.skills.forEach (function(val, idx) {
     p[val] = (p[val] || 0) + 1; //increment counts
  });
  return p;
}

function reduceRemove(p, v) {
  v.skills.forEach (function(val, idx) {
     p[val] = (p[val] || 0) - 1; //decrement counts
  });
  return p;

}

function reduceInitial() {
  return {};
}
