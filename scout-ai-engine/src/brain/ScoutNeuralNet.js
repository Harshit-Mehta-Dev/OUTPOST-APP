/**
 * ==============================================================================
 * SCOUT-BRAIN DEEP NEURAL NETWORK (ScoutNeuralNet)
 * ==============================================================================
 * A fully autonomous, multi-layer feedforward neural network with backpropagation,
 * adaptive learning rate, momentum optimization, and LeakyReLU/Softmax activations.
 * Operates 100% locally with zero external cloud dependencies.
 * ==============================================================================
 */

class ScoutNeuralNet {
  /**
   * @param {Array<number>} layers Array specifying node count per layer, e.g. [128, 64, 32, 16]
   * @param {Object} options Configuration parameters
   */
  constructor(layers = [64, 48, 32, 16], options = {}) {
    this.layers = layers;
    this.learningRate = options.learningRate || 0.05;
    this.momentum = options.momentum || 0.85;
    this.weights = [];
    this.biases = [];
    this.weightVelocities = [];
    this.biasVelocities = [];
    this.history = [];
    this._initializeWeights();
  }

  /**
   * He (Kaiming) / Xavier Weight Initialization for stable deep gradient propagation
   */
  _initializeWeights() {
    this.weights = [];
    this.biases = [];
    this.weightVelocities = [];
    this.biasVelocities = [];

    for (let i = 0; i < this.layers.length - 1; i++) {
      const inputDim = this.layers[i];
      const outputDim = this.layers[i + 1];

      // He normal initialization standard deviation
      const stdDev = Math.sqrt(2.0 / inputDim);

      const layerWeights = [];
      const layerWeightV = [];
      for (let r = 0; r < outputDim; r++) {
        const row = [];
        const rowV = [];
        for (let c = 0; c < inputDim; c++) {
          row.push((Math.random() * 2 - 1) * stdDev);
          rowV.push(0.0);
        }
        layerWeights.push(row);
        layerWeightV.push(rowV);
      }

      const layerBiases = new Array(outputDim).fill(0.01);
      const layerBiasV = new Array(outputDim).fill(0.0);

      this.weights.push(layerWeights);
      this.biases.push(layerBiases);
      this.weightVelocities.push(layerWeightV);
      this.biasVelocities.push(layerBiasV);
    }
  }

  /**
   * Leaky ReLU activation function
   */
  _leakyRelu(x) {
    return x > 0 ? x : 0.01 * x;
  }

  _leakyReluDerivative(x) {
    return x > 0 ? 1 : 0.01;
  }

  /**
   * Softmax for the output probability distribution
   */
  _softmax(arr) {
    const maxVal = Math.max(...arr);
    const exps = arr.map(x => Math.exp(x - maxVal));
    const sumExps = exps.reduce((a, b) => a + b, 0) || 1e-9;
    return exps.map(x => x / sumExps);
  }

  /**
   * Forward pass through all deep layers
   * @param {Array<number>} inputVector Normalized input features
   * @returns {{activations: Array<Array<number>>, zValues: Array<Array<number>>, output: Array<number>}}
   */
  forward(inputVector) {
    const activations = [inputVector];
    const zValues = [];

    let current = inputVector;

    for (let l = 0; l < this.weights.length; l++) {
      const W = this.weights[l];
      const B = this.biases[l];
      const isOutputLayer = (l === this.weights.length - 1);

      const zLayer = [];
      const nextA = [];

      for (let j = 0; j < W.length; j++) {
        let sum = B[j];
        const row = W[j];
        for (let k = 0; k < current.length; k++) {
          sum += row[k] * current[k];
        }
        zLayer.push(sum);
        if (!isOutputLayer) {
          nextA.push(this._leakyRelu(sum));
        }
      }

      zValues.push(zLayer);

      if (isOutputLayer) {
        activations.push(this._softmax(zLayer));
      } else {
        activations.push(nextA);
      }

      current = activations[activations.length - 1];
    }

    return {
      activations,
      zValues,
      output: activations[activations.length - 1]
    };
  }

  /**
   * Backward pass (Backpropagation with Momentum)
   * @param {Array<number>} targetVector One-hot encoded ground truth
   * @param {Object} forwardCache Results from forward pass
   * @returns {number} Cross-entropy loss
   */
  backward(targetVector, forwardCache) {
    const { activations, zValues, output } = forwardCache;
    const numLayers = this.weights.length;

    // Cross-entropy loss
    let loss = 0;
    for (let i = 0; i < targetVector.length; i++) {
      if (targetVector[i] > 0) {
        loss -= Math.log(Math.max(output[i], 1e-12));
      }
    }

    // Output layer error (Softmax + Cross Entropy simplifies to output - target)
    let deltas = [];
    const outputDelta = [];
    for (let i = 0; i < output.length; i++) {
      outputDelta.push(output[i] - targetVector[i]);
    }
    deltas.unshift(outputDelta);

    // Propagate backward through hidden layers
    for (let l = numLayers - 2; l >= 0; l--) {
      const nextDelta = deltas[0];
      const nextW = this.weights[l + 1];
      const currentZ = zValues[l];

      const currentDelta = [];
      for (let j = 0; j < this.layers[l + 1]; j++) {
        let error = 0;
        for (let k = 0; k < nextDelta.length; k++) {
          error += nextW[k][j] * nextDelta[k];
        }
        currentDelta.push(error * this._leakyReluDerivative(currentZ[j]));
      }
      deltas.unshift(currentDelta);
    }

    // Apply gradients with Momentum & Gradient Clipping
    const MAX_GRAD = 5.0;

    for (let l = 0; l < numLayers; l++) {
      const layerActivations = activations[l];
      const deltaLayer = deltas[l];
      const W = this.weights[l];
      const B = this.biases[l];
      const vW = this.weightVelocities[l];
      const vB = this.biasVelocities[l];

      for (let j = 0; j < W.length; j++) {
        for (let k = 0; k < layerActivations.length; k++) {
          let grad = deltaLayer[j] * layerActivations[k];
          // Gradient clipping
          if (grad > MAX_GRAD) grad = MAX_GRAD;
          if (grad < -MAX_GRAD) grad = -MAX_GRAD;

          vW[j][k] = this.momentum * vW[j][k] - this.learningRate * grad;
          W[j][k] += vW[j][k];
        }
        let biasGrad = deltaLayer[j];
        if (biasGrad > MAX_GRAD) biasGrad = MAX_GRAD;
        if (biasGrad < -MAX_GRAD) biasGrad = -MAX_GRAD;

        vB[j] = this.momentum * vB[j] - this.learningRate * biasGrad;
        B[j] += vB[j];
      }
    }

    return loss;
  }

  /**
   * Train over a dataset for a given number of epochs
   */
  train(dataset, epochs = 100, onEpoch = null) {
    for (let e = 0; e < epochs; e++) {
      let totalLoss = 0;
      for (const sample of dataset) {
        const cache = this.forward(sample.input);
        const loss = this.backward(sample.target, cache);
        totalLoss += loss;
      }
      const avgLoss = totalLoss / (dataset.length || 1);
      this.history.push({ epoch: e + 1, loss: avgLoss });
      if (onEpoch && (e % 10 === 0 || e === epochs - 1)) {
        onEpoch(e + 1, avgLoss);
      }
    }
  }

  /**
   * Export neural weights as a compact JSON object for snapshot persistence
   */
  exportWeights() {
    return {
      layers: this.layers,
      weights: this.weights,
      biases: this.biases,
      learningRate: this.learningRate,
      momentum: this.momentum,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import pre-trained model weights
   */
  importWeights(snapshot) {
    this.layers = snapshot.layers;
    this.weights = snapshot.weights;
    this.biases = snapshot.biases;
    this.learningRate = snapshot.learningRate || this.learningRate;
    this.momentum = snapshot.momentum || this.momentum;
    this.weightVelocities = [];
    this.biasVelocities = [];
    for (let i = 0; i < this.weights.length; i++) {
      this.weightVelocities.push(this.weights[i].map(row => new Array(row.length).fill(0.0)));
      this.biasVelocities.push(new Array(this.biases[i].length).fill(0.0));
    }
  }
}

module.exports = ScoutNeuralNet;
