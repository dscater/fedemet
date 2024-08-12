$(document).ready(function () {
    usuarios();
    doctores();
    pacientes();
    // kardex();
});

function usuarios()
{
    var tipo = $('#m_usuarios #tipo').parents('.form-group');
    var fecha_ini = $('#m_usuarios #fecha_ini').parents('.form-group');
    var fecha_fin = $('#m_usuarios #fecha_fin').parents('.form-group');

    tipo.hide();
    fecha_ini.hide();
    fecha_fin.hide();
    $('#m_usuarios select#filtro').change(function(){
        let filtro = $(this).val();
        switch(filtro)
        {
            case 'todos':
                tipo.hide();
                fecha_ini.hide();
                fecha_fin.hide();
            break;
            case 'tipo':
                tipo.show();
                fecha_ini.hide();
                fecha_fin.hide();
            break;
            case 'fecha':
                tipo.hide();
                fecha_ini.show();
                fecha_fin.show();
            break;
        }
    });
}

function doctores()
{
    var fecha_ini = $('#m_doctores #fecha_ini').parents('.form-group');
    var fecha_fin = $('#m_doctores #fecha_fin').parents('.form-group');
    var especialidad_id = $('#m_doctores #especialidad_id').parents('.form-group');
    
    fecha_ini.hide();
    fecha_fin.hide();
    especialidad_id.hide();
    $('#m_doctores select#filtro').change(function(){
        let filtro = $(this).val();
        switch(filtro)
        {
            case 'todos':
                especialidad_id.hide();
                fecha_ini.hide();
                fecha_fin.hide();
            break;
            case 'especialidad':
                especialidad_id.show();
                fecha_ini.hide();
                fecha_fin.hide();
            break;
            case 'fecha':
                especialidad_id.hide();
                fecha_ini.show();
                fecha_fin.show();
            break;
        }
    });
}

function pacientes()
{
    var fecha_ini = $('#m_pacientes #fecha_ini').parents('.form-group');
    var fecha_fin = $('#m_pacientes #fecha_fin').parents('.form-group');
    var especialidad_id = $('#m_pacientes #especialidad_id').parents('.form-group');
    
    fecha_ini.hide();
    fecha_fin.hide();
    especialidad_id.hide();
    $('#m_pacientes select#filtro').change(function(){
        let filtro = $(this).val();
        switch(filtro)
        {
            case 'todos':
                fecha_ini.hide();
                fecha_fin.hide();
            break;
            case 'especialidad':
                especialidad_id.show();
                fecha_ini.hide();
                fecha_fin.hide();
            break;
            case 'fecha':
                especialidad_id.hide();
                fecha_ini.show();
                fecha_fin.show();
            break;
        }
    });
}

function kardex()
{
    var paciente = $('#m_kardex #paciente').parents('.form-group');
    var fecha_ini = $('#m_kardex #fecha_ini').parents('.form-group');
    var fecha_fin = $('#m_kardex #fecha_fin').parents('.form-group');

    paciente.hide();
    fecha_ini.hide();
    fecha_fin.hide();
    $('#m_kardex select#filtro').change(function(){
        let filtro = $(this).val();
        switch(filtro)
        {
            case 'todos':
                paciente.hide();
                fecha_ini.hide();
                fecha_fin.hide();
            break;
            case 'paciente':
                paciente.show();
                fecha_ini.hide();
                fecha_fin.hide();
            break;
            case 'fecha':
                paciente.hide();
                fecha_ini.show();
                fecha_fin.show();
            break;
        }
    });
}