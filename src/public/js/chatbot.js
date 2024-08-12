var actualizaciones = null;
$(document).ready(function () {
    obtieneUpdatesBot();
});

function obtieneUpdatesBot()
{
    $.ajax({
        type: "GET",
        url: `https://api.telegram.org/bot${$('#tokenBot').val()}/getUpdates`,
        data: "",
        dataType: "json",
        success: function (response) {
            if(response.ok)
            {
                if(response.result.length > 0)
                {
                    enviaResultados(response.result);
                }
                else{
                    clearInterval(actualizaciones);
                    actualizaciones = setInterval(obtieneUpdatesBot,3000);
                }
            }
            else{
            }
        }
    });
}

function limpiarResultados(update_id)
{
    $.ajax({
        headers:{'X-CSRF-TOKEN':$('#token').val()},
        type: "POST",
        url: $('#urlLimpiaResultados').val(),
        data: {update_id:update_id},
        dataType: "json",
        success: function (response) {
            
        }
    });
}

function enviaResultados(resultados)
{
    $.ajax({
        headers: {'X-CSRF-TOKEN':$('#token').val()},
        type: "POST",
        url: $('#urlRespondeBot').val(),
        async: false,
        data: {
            resultados:resultados
        },
        dataType: "json",
        success: function (response) {
            clearInterval(actualizaciones);
            if(response.ok != true)
            {
                actualizaciones = setInterval(obtieneUpdatesBot,3000);
            }
            else{
                actualizaciones = setInterval(obtieneUpdatesBot,2000);
            }
            console.log(response);
        }
    }).fail(function(){
        clearInterval(actualizaciones);
        actualizaciones = setInterval(function(){
            obtieneUpdatesBot();
        },3000);
    });
}
