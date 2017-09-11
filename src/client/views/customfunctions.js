Office.initialize = function(reason){  
    
    function test(num) {
        return "42";
    }
    
    Excel.Script.CustomFunctions = {};
    Excel.Script.CustomFunctions["CF"] = {};
    Excel.Script.CustomFunctions["CF"]["TEST"] = {
        call: test,
        description: "test description",
        helpUrl: "https://example.com/help.html",
        result: {
            resultType: Excel.CustomFunctionValueType.number,
            resultDimensionality: Excel.CustomFunctionDimensionality.scalar,
        },
        parameters: [
            {
                name: "num",
                description: "test description",
                valueType: Excel.CustomFunctionValueType.number,
                valueDimensionality: Excel.CustomFunctionDimensionality.scalar,
            },
        ],
        options: {
            batch: false,
            stream: false,
        }
    };

    Excel.run(function (context) {
        context.workbook.customFunctions.addAll();
        return context.sync().then(function(){
            console.log("added all functions");
        });
    
    }).catch(function(error){
        console.log("error" + error);
    });
};