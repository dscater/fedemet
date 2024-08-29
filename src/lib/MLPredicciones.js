// exportamos la libreria de tensorflow
const tf = require('@tensorflow/tfjs');

// Función para normalizar los datos
const normalizeData = (data) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return data.map(x => (x - min) / (max - min));
}

// Función para entrenar y guardar un modelo específico para cada registro
const entrenamiento = async (features, labels)=> {
    const model = tf.sequential();

    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [features[0].length] }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'meanSquaredError'
    });

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    await model.fit(xs, ys, {
        epochs: 100,
        batchSize: 32
    });

    // devolver el modelo entrenado
    return model;
}

// Función para predecir la cantidad total futura de un registro
const prediccionDatos =async (model, inputData)=>{
    const features = inputData.map(d => [
        d.historicalValue,
        d.currentValue
    ]);

    const normalizedFeatures = features.map(row => normalizeData(row));

    const predictions = model.predict(tf.tensor2d(normalizedFeatures));
    const predictedValues = Array.from(predictions.dataSync());

    return predictedValues;
}


module.exports = {normalizeData, entrenamiento, prediccionDatos};